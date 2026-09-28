package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.AppDatabase
import com.example.data.local.entity.CompanyEntity
import com.example.data.local.entity.CustomerEntity
import com.example.data.local.entity.CustomerLedgerEntity
import com.example.data.local.entity.InvoiceEntity
import com.example.data.local.entity.InvoiceItemEntity
import com.example.data.local.entity.ProductEntity
import com.example.data.local.entity.ShopEntity
import com.example.data.local.entity.ShopStockEntity
import com.example.data.repository.ToyGalleryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class ScreenTab {
    POS_BILLING,
    PRODUCTS,
    COMPANY_STOCK,
    CUSTOMERS,
    INVOICES,
    MULTI_SHOP
}

enum class LanguageMode {
    ENGLISH,
    BANGLA,
    BOTH
}

enum class InvoicePrintFormat {
    POS_80MM,
    A4_FULL
}

data class CartItem(
    val product: ProductEntity,
    val cartons: Int = 0,
    val loosePcs: Int = 0,
    val ratePerCarton: Double = product.sellingPriceCarton,
    val ratePerPc: Double = product.sellingPricePc
) {
    val totalPcs: Int
        get() = (cartons * product.pcsPerCarton) + loosePcs

    val totalAmount: Double
        get() = (cartons * ratePerCarton) + (loosePcs * ratePerPc)
}

class ToyGalleryViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: ToyGalleryRepository = ToyGalleryRepository(
        AppDatabase.getInstance(application)
    )

    // Current Screen Tab
    private val _currentTab = MutableStateFlow(ScreenTab.POS_BILLING)
    val currentTab: StateFlow<ScreenTab> = _currentTab.asStateFlow()

    // Global Language Mode (EN, বাংলা, Both)
    private val _languageMode = MutableStateFlow(LanguageMode.BOTH)
    val languageMode: StateFlow<LanguageMode> = _languageMode.asStateFlow()

    // Active Selected Shop
    private val _activeShopId = MutableStateFlow<Long?>(null)
    val activeShopId: StateFlow<Long?> = _activeShopId.asStateFlow()

    // Raw Data Streams
    val shops: StateFlow<List<ShopEntity>> = repository.allShops.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )

    val companies: StateFlow<List<CompanyEntity>> = repository.allCompanies.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )

    val products: StateFlow<List<ProductEntity>> = repository.allProducts.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )

    val customers: StateFlow<List<CustomerEntity>> = repository.allCustomers.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )

    val invoices: StateFlow<List<InvoiceEntity>> = repository.allInvoices.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )

    val allStocks: StateFlow<List<ShopStockEntity>> = repository.allStocks.stateIn(
        viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList()
    )

    // Active Shop Entity
    val activeShop: StateFlow<ShopEntity?> = combine(shops, activeShopId) { shopList, id ->
        if (shopList.isEmpty()) null
        else if (id == null) shopList.firstOrNull { it.isMain } ?: shopList.firstOrNull()
        else shopList.firstOrNull { it.id == id } ?: shopList.firstOrNull()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // Stock Map for Active Shop: productId -> totalPcs
    val activeShopStockMap: StateFlow<Map<Long, Int>> = combine(allStocks, activeShop) { stocks, shop ->
        if (shop == null) emptyMap()
        else stocks.filter { it.shopId == shop.id }.associate { it.productId to it.totalPcs }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyMap())

    // All Shops Stock Map: productId -> totalPcs across all shops
    val totalStockAcrossAllShops: StateFlow<Map<Long, Int>> = allStocks.combine(products) { stocks, _ ->
        val map = mutableMapOf<Long, Int>()
        for (s in stocks) {
            map[s.productId] = (map[s.productId] ?: 0) + s.totalPcs
        }
        map
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyMap())

    // Low stock product IDs in active shop
    val lowStockProductIds: StateFlow<Set<Long>> = combine(products, activeShopStockMap) { prods, stockMap ->
        prods.filter { p ->
            val totalPcs = stockMap[p.id] ?: 0
            val cartons = if (p.pcsPerCarton > 0) totalPcs / p.pcsPerCarton else 0
            cartons <= p.lowStockThresholdCartons
        }.map { it.id }.toSet()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptySet())

    // ==========================================
    // POS BILLING STATE (Module 2)
    // ==========================================
    private val _selectedCustomer = MutableStateFlow<CustomerEntity?>(null)
    val selectedCustomer: StateFlow<CustomerEntity?> = _selectedCustomer.asStateFlow()

    private val _cartItems = MutableStateFlow<List<CartItem>>(emptyList())
    val cartItems: StateFlow<List<CartItem>> = _cartItems.asStateFlow()

    private val _posSearchQuery = MutableStateFlow("")
    val posSearchQuery: StateFlow<String> = _posSearchQuery.asStateFlow()

    private val _posCategoryFilter = MutableStateFlow<String?>(null)
    val posCategoryFilter: StateFlow<String?> = _posCategoryFilter.asStateFlow()

    private val _posCompanyFilter = MutableStateFlow<String?>(null)
    val posCompanyFilter: StateFlow<String?> = _posCompanyFilter.asStateFlow()

    private val _discount = MutableStateFlow(0.0)
    val discount: StateFlow<Double> = _discount.asStateFlow()

    private val _paidNowInput = MutableStateFlow("")
    val paidNowInput: StateFlow<String> = _paidNowInput.asStateFlow()

    private val _paymentMethod = MutableStateFlow("Cash")
    val paymentMethod: StateFlow<String> = _paymentMethod.asStateFlow()

    private val _selectedBank = MutableStateFlow("Islami Bank Bangladesh Ltd (IBBL)")
    val selectedBank: StateFlow<String> = _selectedBank.asStateFlow()

    private val _transactionId = MutableStateFlow("")
    val transactionId: StateFlow<String> = _transactionId.asStateFlow()

    private val _billingNotes = MutableStateFlow("")
    val billingNotes: StateFlow<String> = _billingNotes.asStateFlow()

    // Filtered POS products
    val filteredPosProducts: StateFlow<List<ProductEntity>> = combine(
        products, posSearchQuery, posCategoryFilter, posCompanyFilter
    ) { prods, query, cat, comp ->
        val q = query.trim().lowercase()
        prods.filter { p ->
            val matchQuery = if (q.isBlank()) true else {
                p.nameEn.lowercase().contains(q) ||
                        p.nameBn.contains(q) ||
                        p.sku.lowercase().contains(q) ||
                        p.companyName.lowercase().contains(q) ||
                        p.category.lowercase().contains(q)
            }
            val matchCat = cat == null || p.category.equals(cat, ignoreCase = true)
            val matchComp = comp == null || p.companyName.equals(comp, ignoreCase = true)
            matchQuery && matchCat && matchComp
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Running Due Calculations for POS
    val subtotal: StateFlow<Double> = _cartItems.combine(MutableStateFlow(0)) { items, _ ->
        items.sumOf { it.totalAmount }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val currentBill: StateFlow<Double> = combine(subtotal, _discount) { sub, disc ->
        (sub - disc).coerceAtLeast(0.0)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val previousDue: StateFlow<Double> = _selectedCustomer.combine(MutableStateFlow(0)) { cust, _ ->
        cust?.currentDue ?: 0.0
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val totalDue: StateFlow<Double> = combine(previousDue, currentBill) { prev, bill ->
        prev + bill
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val paidNowAmount: StateFlow<Double> = _paidNowInput.combine(MutableStateFlow(0)) { input, _ ->
        input.toDoubleOrNull() ?: 0.0
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val billDue: StateFlow<Double> = combine(currentBill, paidNowAmount) { bill, paid ->
        (bill - paid).coerceAtLeast(0.0)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    val netTotalDue: StateFlow<Double> = combine(totalDue, paidNowAmount) { total, paid ->
        (total - paid).coerceAtLeast(0.0)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    // ==========================================
    // INVOICE PREVIEW / PRINT STATE
    // ==========================================
    private val _previewInvoice = MutableStateFlow<InvoiceEntity?>(null)
    val previewInvoice: StateFlow<InvoiceEntity?> = _previewInvoice.asStateFlow()

    private val _previewInvoiceItems = MutableStateFlow<List<InvoiceItemEntity>>(emptyList())
    val previewInvoiceItems: StateFlow<List<InvoiceItemEntity>> = _previewInvoiceItems.asStateFlow()

    private val _invoicePrintFormat = MutableStateFlow(InvoicePrintFormat.POS_80MM)
    val invoicePrintFormat: StateFlow<InvoicePrintFormat> = _invoicePrintFormat.asStateFlow()

    private val _invoicePrintLanguage = MutableStateFlow(LanguageMode.BOTH)
    val invoicePrintLanguage: StateFlow<LanguageMode> = _invoicePrintLanguage.asStateFlow()

    // ==========================================
    // CUSTOMER LEDGER STATE
    // ==========================================
    private val _viewingLedgerCustomer = MutableStateFlow<CustomerEntity?>(null)
    val viewingLedgerCustomer: StateFlow<CustomerEntity?> = _viewingLedgerCustomer.asStateFlow()

    private val _customerLedger = MutableStateFlow<List<CustomerLedgerEntity>>(emptyList())
    val customerLedger: StateFlow<List<CustomerLedgerEntity>> = _customerLedger.asStateFlow()

    // UI Message / Toast
    private val _uiMessage = MutableStateFlow<String?>(null)
    val uiMessage: StateFlow<String?> = _uiMessage.asStateFlow()

    init {
        viewModelScope.launch {
            repository.ensureInitialData()
        }
    }

    fun setTab(tab: ScreenTab) {
        _currentTab.value = tab
    }

    fun setLanguageMode(mode: LanguageMode) {
        _languageMode.value = mode
    }

    fun setActiveShop(shopId: Long) {
        _activeShopId.value = shopId
    }

    fun clearUiMessage() {
        _uiMessage.value = null
    }

    // ==========================================
    // POS BILLING ACTIONS
    // ==========================================
    fun setPosSearchQuery(query: String) {
        _posSearchQuery.value = query
    }

    fun setPosCategoryFilter(category: String?) {
        _posCategoryFilter.value = category
    }

    fun setPosCompanyFilter(company: String?) {
        _posCompanyFilter.value = company
    }

    fun selectCustomer(customer: CustomerEntity?) {
        _selectedCustomer.value = customer
    }

    fun setDiscount(value: Double) {
        _discount.value = value.coerceAtLeast(0.0)
    }

    fun setPaidNowInput(text: String) {
        _paidNowInput.value = text
    }

    fun setPaymentMethod(method: String) {
        _paymentMethod.value = method
    }

    fun setSelectedBank(bank: String) {
        _selectedBank.value = bank
    }

    fun setTransactionId(id: String) {
        _transactionId.value = id
    }

    fun setBillingNotes(notes: String) {
        _billingNotes.value = notes
    }

    fun addProductToCart(product: ProductEntity, cartons: Int = 1, loosePcs: Int = 0) {
        val current = _cartItems.value.toMutableList()
        val index = current.indexOfFirst { it.product.id == product.id }
        if (index >= 0) {
            val existing = current[index]
            current[index] = existing.copy(
                cartons = existing.cartons + cartons,
                loosePcs = existing.loosePcs + loosePcs
            )
        } else {
            current.add(
                CartItem(
                    product = product,
                    cartons = cartons,
                    loosePcs = loosePcs,
                    ratePerCarton = product.sellingPriceCarton,
                    ratePerPc = product.sellingPricePc
                )
            )
        }
        _cartItems.value = current
    }

    fun updateCartItemQuantity(productId: Long, cartons: Int, loosePcs: Int) {
        val current = _cartItems.value.toMutableList()
        val index = current.indexOfFirst { it.product.id == productId }
        if (index >= 0) {
            if (cartons <= 0 && loosePcs <= 0) {
                current.removeAt(index)
            } else {
                current[index] = current[index].copy(
                    cartons = cartons.coerceAtLeast(0),
                    loosePcs = loosePcs.coerceAtLeast(0)
                )
            }
            _cartItems.value = current
        }
    }

    fun updateCartItemRate(productId: Long, ratePerCarton: Double, ratePerPc: Double) {
        val current = _cartItems.value.toMutableList()
        val index = current.indexOfFirst { it.product.id == productId }
        if (index >= 0) {
            current[index] = current[index].copy(
                ratePerCarton = ratePerCarton,
                ratePerPc = ratePerPc
            )
            _cartItems.value = current
        }
    }

    fun removeCartItem(productId: Long) {
        _cartItems.value = _cartItems.value.filter { it.product.id != productId }
    }

    fun clearCart() {
        _cartItems.value = emptyList()
        _discount.value = 0.0
        _paidNowInput.value = ""
        _transactionId.value = ""
        _billingNotes.value = ""
    }

    fun quickPayFullCurrentBill() {
        _paidNowInput.value = currentBill.value.toInt().toString()
    }

    fun quickPayFullTotalDue() {
        _paidNowInput.value = totalDue.value.toInt().toString()
    }

    fun checkoutInvoice(onSuccess: (InvoiceEntity) -> Unit) {
        val shop = activeShop.value
        val customer = selectedCustomer.value
        val items = cartItems.value

        if (shop == null) {
            _uiMessage.value = "Error: Please select an active shop/branch"
            return
        }
        if (customer == null) {
            _uiMessage.value = "Error: Please select or add a customer"
            return
        }
        if (items.isEmpty()) {
            _uiMessage.value = "Error: Cart is empty"
            return
        }

        viewModelScope.launch {
            try {
                val invoiceItems = items.map { cartItem ->
                    InvoiceItemEntity(
                        invoiceId = 0,
                        productId = cartItem.product.id,
                        productNameEn = cartItem.product.nameEn,
                        productNameBn = cartItem.product.nameBn,
                        companyName = cartItem.product.companyName,
                        pcsPerCarton = cartItem.product.pcsPerCarton,
                        cartonsQuantity = cartItem.cartons,
                        pcsQuantity = cartItem.loosePcs,
                        totalPcs = cartItem.totalPcs,
                        ratePerCarton = cartItem.ratePerCarton,
                        ratePerPc = cartItem.ratePerPc,
                        totalAmount = cartItem.totalAmount
                    )
                }

                val savedInvoice = repository.processSaleInvoice(
                    shop = shop,
                    customer = customer,
                    items = invoiceItems,
                    discount = discount.value,
                    paidNow = paidNowAmount.value,
                    paymentMethod = paymentMethod.value,
                    bankName = if (paymentMethod.value == "Bank") selectedBank.value else "",
                    transactionId = transactionId.value,
                    notes = billingNotes.value
                )

                // Refresh selected customer with new due
                val updatedCustomer = customers.value.firstOrNull { it.id == customer.id }
                if (updatedCustomer != null) {
                    _selectedCustomer.value = updatedCustomer
                }

                // Show Invoice preview
                _previewInvoice.value = savedInvoice
                _previewInvoiceItems.value = invoiceItems

                clearCart()
                _uiMessage.value = "Invoice ${savedInvoice.invoiceNumber} created successfully!"
                onSuccess(savedInvoice)
            } catch (e: Exception) {
                _uiMessage.value = "Checkout failed: ${e.localizedMessage}"
            }
        }
    }

    // ==========================================
    // INVOICE PREVIEW / PRINT
    // ==========================================
    fun openInvoicePreview(invoice: InvoiceEntity) {
        viewModelScope.launch {
            val items = repository.getInvoiceItems(invoice.id)
            items.collect { itemList ->
                _previewInvoice.value = invoice
                _previewInvoiceItems.value = itemList
            }
        }
    }

    fun closeInvoicePreview() {
        _previewInvoice.value = null
        _previewInvoiceItems.value = emptyList()
    }

    fun setInvoicePrintFormat(format: InvoicePrintFormat) {
        _invoicePrintFormat.value = format
    }

    fun setInvoicePrintLanguage(lang: LanguageMode) {
        _invoicePrintLanguage.value = lang
    }

    // ==========================================
    // CUSTOMER MANAGEMENT & LEDGER
    // ==========================================
    fun openCustomerLedger(customer: CustomerEntity) {
        _viewingLedgerCustomer.value = customer
        viewModelScope.launch {
            repository.getLedgerForCustomer(customer.id).collect {
                _customerLedger.value = it
            }
        }
    }

    fun closeCustomerLedger() {
        _viewingLedgerCustomer.value = null
        _customerLedger.value = emptyList()
    }

    fun addNewCustomer(
        name: String,
        phone: String,
        address: String,
        customerType: String,
        openingDue: Double,
        notes: String,
        autoSelectInPos: Boolean = false
    ) {
        viewModelScope.launch {
            val customer = CustomerEntity(
                name = name.trim(),
                phone = phone.trim(),
                address = address.trim(),
                customerType = customerType,
                currentDue = openingDue,
                notes = notes.trim()
            )
            val id = repository.addCustomer(customer)
            val created = customer.copy(id = id)
            if (autoSelectInPos) {
                _selectedCustomer.value = created
            }
            _uiMessage.value = "Customer '$name' added with Previous Due: ৳${openingDue.toInt()}"
        }
    }

    fun collectCustomerDue(
        customer: CustomerEntity,
        amount: Double,
        method: String,
        bankName: String,
        transactionId: String,
        notes: String
    ) {
        viewModelScope.launch {
            try {
                val newDue = repository.collectCustomerDue(
                    customer = customer,
                    amount = amount,
                    paymentMethod = method,
                    bankName = bankName,
                    transactionId = transactionId,
                    notes = notes
                )
                _uiMessage.value = "Collected ৳${amount.toInt()} from ${customer.name}. New Due: ৳${newDue.toInt()}"
                // Update viewing customer
                _viewingLedgerCustomer.value = customer.copy(currentDue = newDue)
            } catch (e: Exception) {
                _uiMessage.value = "Collection failed: ${e.localizedMessage}"
            }
        }
    }

    // ==========================================
    // PRODUCT, COMPANY & MULTI-SHOP MANAGEMENT
    // ==========================================
    fun addNewShop(name: String, address: String, phone: String, isMain: Boolean = false) {
        viewModelScope.launch {
            val shop = ShopEntity(
                name = name.trim(),
                address = address.trim(),
                phone = phone.trim(),
                isMain = isMain,
                isActive = true
            )
            repository.addShop(shop)
            _uiMessage.value = "Shop branch '$name' created!"
        }
    }

    fun addNewCompany(name: String, contactPerson: String, phone: String, address: String) {
        viewModelScope.launch {
            val company = CompanyEntity(
                name = name.trim(),
                contactPerson = contactPerson.trim(),
                phone = phone.trim(),
                address = address.trim()
            )
            repository.addCompany(company)
            _uiMessage.value = "Company '$name' added!"
        }
    }

    fun addNewProduct(
        sku: String,
        nameEn: String,
        nameBn: String,
        companyId: Long,
        companyName: String,
        category: String,
        pcsPerCarton: Int,
        purchaseRateCarton: Double,
        purchaseRatePc: Double,
        sellingRateCarton: Double,
        sellingRatePc: Double,
        lowStockCartons: Int,
        description: String,
        initialCartons: Int,
        initialLoosePcs: Int,
        targetShopId: Long
    ) {
        viewModelScope.launch {
            val product = ProductEntity(
                sku = sku.trim().ifBlank { "TG-${System.currentTimeMillis() % 100000}" },
                nameEn = nameEn.trim(),
                nameBn = nameBn.trim(),
                companyId = companyId,
                companyName = companyName,
                category = category.trim().ifBlank { "General Toys" },
                pcsPerCarton = pcsPerCarton.coerceAtLeast(1),
                purchasePriceCarton = purchaseRateCarton,
                purchasePricePc = purchaseRatePc,
                sellingPriceCarton = sellingRateCarton,
                sellingPricePc = sellingRatePc,
                lowStockThresholdCartons = lowStockCartons,
                description = description.trim()
            )
            repository.addProduct(
                product = product,
                initialCartons = initialCartons,
                initialPcs = initialLoosePcs,
                targetShopId = targetShopId
            )
            _uiMessage.value = "Product '$nameEn' added with Carton conversion (1 Ctn = $pcsPerCarton Pcs)!"
        }
    }

    fun addStockToProduct(shopId: Long, productId: Long, cartonsToAdd: Int, pcsToAdd: Int, pcsPerCarton: Int) {
        viewModelScope.launch {
            repository.addStock(
                shopId = shopId,
                productId = productId,
                addCartons = cartonsToAdd,
                addPcs = pcsToAdd,
                pcsPerCarton = pcsPerCarton
            )
            _uiMessage.value = "Stock updated (+${cartonsToAdd} Ctns, +${pcsToAdd} Pcs)"
        }
    }

    // ==========================================
    // EXPORT UTILITIES (UTF-8 BOM FOR BANGLA IN EXCEL)
    // ==========================================
    suspend fun exportProductsCsv(): String {
        return repository.exportProductsCsvWithBom(
            products = products.value,
            stocksMap = activeShopStockMap.value
        )
    }

    suspend fun exportCustomerLedgerCsv(customer: CustomerEntity): String {
        return repository.exportCustomerLedgerCsvWithBom(
            customer = customer,
            ledger = customerLedger.value
        )
    }
}
