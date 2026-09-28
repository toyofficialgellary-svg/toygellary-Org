package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AddShoppingCart
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.DeleteOutline
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.local.entity.CustomerEntity
import com.example.data.local.entity.ProductEntity
import com.example.data.util.BangladeshBanks
import com.example.ui.CartItem
import com.example.ui.LanguageMode
import com.example.ui.ToyGalleryViewModel
import com.example.ui.components.NewCustomerDialog
import com.example.ui.theme.AccentTeal
import com.example.ui.theme.DueCrimson
import com.example.ui.theme.PaidEmerald
import com.example.ui.theme.PrimaryIndigo
import com.example.ui.theme.ToyAmber

@Composable
fun PosBillingScreen(
    viewModel: ToyGalleryViewModel,
    modifier: Modifier = Modifier
) {
    val languageMode by viewModel.languageMode.collectAsStateWithLifecycle()
    val activeShop by viewModel.activeShop.collectAsStateWithLifecycle()
    val customers by viewModel.customers.collectAsStateWithLifecycle()
    val selectedCustomer by viewModel.selectedCustomer.collectAsStateWithLifecycle()
    val companies by viewModel.companies.collectAsStateWithLifecycle()

    val filteredProducts by viewModel.filteredPosProducts.collectAsStateWithLifecycle()
    val activeShopStockMap by viewModel.activeShopStockMap.collectAsStateWithLifecycle()
    val lowStockIds by viewModel.lowStockProductIds.collectAsStateWithLifecycle()

    val cartItems by viewModel.cartItems.collectAsStateWithLifecycle()
    val searchQuery by viewModel.posSearchQuery.collectAsStateWithLifecycle()
    val companyFilter by viewModel.posCompanyFilter.collectAsStateWithLifecycle()

    val subtotal by viewModel.subtotal.collectAsStateWithLifecycle()
    val discount by viewModel.discount.collectAsStateWithLifecycle()
    val currentBill by viewModel.currentBill.collectAsStateWithLifecycle()
    val previousDue by viewModel.previousDue.collectAsStateWithLifecycle()
    val totalDue by viewModel.totalDue.collectAsStateWithLifecycle()
    val paidNowInput by viewModel.paidNowInput.collectAsStateWithLifecycle()
    val billDue by viewModel.billDue.collectAsStateWithLifecycle()
    val netTotalDue by viewModel.netTotalDue.collectAsStateWithLifecycle()

    val paymentMethod by viewModel.paymentMethod.collectAsStateWithLifecycle()
    val selectedBank by viewModel.selectedBank.collectAsStateWithLifecycle()
    val transactionId by viewModel.transactionId.collectAsStateWithLifecycle()

    var showNewCustomerDialog by remember { mutableStateOf(false) }
    var customerDropdownExpanded by remember { mutableStateOf(false) }
    var bankDropdownExpanded by remember { mutableStateOf(false) }

    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val isWideScreen = maxWidth >= 840.dp

        if (isWideScreen) {
            // Tablet / Desktop 2-Column POS Layout
            Row(modifier = Modifier.fillMaxSize()) {
                // Left Column: Catalog & Product Selection
                Column(
                    modifier = Modifier
                        .weight(1.3f)
                        .fillMaxHeight()
                        .padding(12.dp)
                ) {
                    PosCustomerAndCatalogSection(
                        selectedCustomer = selectedCustomer,
                        customers = customers,
                        previousDue = previousDue,
                        onSelectCustomer = { viewModel.selectCustomer(it) },
                        onOpenAddCustomer = { showNewCustomerDialog = true },
                        customerDropdownExpanded = customerDropdownExpanded,
                        onSetCustomerDropdown = { customerDropdownExpanded = it },
                        searchQuery = searchQuery,
                        onSearchChange = { viewModel.setPosSearchQuery(it) },
                        companyFilter = companyFilter,
                        companies = companies.map { it.name },
                        onSelectCompanyFilter = { viewModel.setPosCompanyFilter(it) },
                        products = filteredProducts,
                        stockMap = activeShopStockMap,
                        lowStockIds = lowStockIds,
                        languageMode = languageMode,
                        onAddToCart = { product, ctns, pcs ->
                            viewModel.addProductToCart(product, ctns, pcs)
                        }
                    )
                }

                // Vertical Divider
                Box(
                    modifier = Modifier
                        .width(1.dp)
                        .fillMaxHeight()
                        .background(Color(0xFFCBD5E1))
                )

                // Right Column: Active Cart & Running Due Checkout Panel
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .background(Color(0xFFF8FAFC))
                        .padding(12.dp)
                ) {
                    PosCartAndBillingSection(
                        cartItems = cartItems,
                        languageMode = languageMode,
                        subtotal = subtotal,
                        discount = discount,
                        onDiscountChange = { viewModel.setDiscount(it) },
                        currentBill = currentBill,
                        previousDue = previousDue,
                        totalDue = totalDue,
                        paidNowInput = paidNowInput,
                        onPaidNowChange = { viewModel.setPaidNowInput(it) },
                        billDue = billDue,
                        netTotalDue = netTotalDue,
                        paymentMethod = paymentMethod,
                        onPaymentMethodChange = { viewModel.setPaymentMethod(it) },
                        selectedBank = selectedBank,
                        onSelectedBankChange = { viewModel.setSelectedBank(it) },
                        bankDropdownExpanded = bankDropdownExpanded,
                        onSetBankDropdown = { bankDropdownExpanded = it },
                        transactionId = transactionId,
                        onTransactionIdChange = { viewModel.setTransactionId(it) },
                        onUpdateQty = { id, ctns, pcs -> viewModel.updateCartItemQuantity(id, ctns, pcs) },
                        onRemoveItem = { viewModel.removeCartItem(it) },
                        onClearCart = { viewModel.clearCart() },
                        onQuickPayCurrent = { viewModel.quickPayFullCurrentBill() },
                        onQuickPayTotal = { viewModel.quickPayFullTotalDue() },
                        onCheckout = { viewModel.checkoutInvoice { } }
                    )
                }
            }
        } else {
            // Mobile Vertical Flow with Switchable Cart Tab or Bottom Sheet
            var activeMobilePane by remember { mutableStateOf(0) } // 0: Catalog, 1: Cart & Checkout

            Column(modifier = Modifier.fillMaxSize()) {
                // Mobile Top Switcher Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(PrimaryIndigo)
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = activeMobilePane == 0,
                        onClick = { activeMobilePane = 0 },
                        label = { Text("Products Catalog (${filteredProducts.size})") },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = activeMobilePane == 1,
                        onClick = { activeMobilePane = 1 },
                        label = {
                            Text(
                                "Cart & Due (${cartItems.size} items • ৳${currentBill.toInt()})",
                                fontWeight = FontWeight.Bold
                            )
                        },
                        modifier = Modifier.weight(1f).testTag("mobile_cart_tab")
                    )
                }

                if (activeMobilePane == 0) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(12.dp)
                    ) {
                        PosCustomerAndCatalogSection(
                            selectedCustomer = selectedCustomer,
                            customers = customers,
                            previousDue = previousDue,
                            onSelectCustomer = { viewModel.selectCustomer(it) },
                            onOpenAddCustomer = { showNewCustomerDialog = true },
                            customerDropdownExpanded = customerDropdownExpanded,
                            onSetCustomerDropdown = { customerDropdownExpanded = it },
                            searchQuery = searchQuery,
                            onSearchChange = { viewModel.setPosSearchQuery(it) },
                            companyFilter = companyFilter,
                            companies = companies.map { it.name },
                            onSelectCompanyFilter = { viewModel.setPosCompanyFilter(it) },
                            products = filteredProducts,
                            stockMap = activeShopStockMap,
                            lowStockIds = lowStockIds,
                            languageMode = languageMode,
                            onAddToCart = { product, ctns, pcs ->
                                viewModel.addProductToCart(product, ctns, pcs)
                            }
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFFF8FAFC))
                            .padding(12.dp)
                    ) {
                        PosCartAndBillingSection(
                            cartItems = cartItems,
                            languageMode = languageMode,
                            subtotal = subtotal,
                            discount = discount,
                            onDiscountChange = { viewModel.setDiscount(it) },
                            currentBill = currentBill,
                            previousDue = previousDue,
                            totalDue = totalDue,
                            paidNowInput = paidNowInput,
                            onPaidNowChange = { viewModel.setPaidNowInput(it) },
                            billDue = billDue,
                            netTotalDue = netTotalDue,
                            paymentMethod = paymentMethod,
                            onPaymentMethodChange = { viewModel.setPaymentMethod(it) },
                            selectedBank = selectedBank,
                            onSelectedBankChange = { viewModel.setSelectedBank(it) },
                            bankDropdownExpanded = bankDropdownExpanded,
                            onSetBankDropdown = { bankDropdownExpanded = it },
                            transactionId = transactionId,
                            onTransactionIdChange = { viewModel.setTransactionId(it) },
                            onUpdateQty = { id, ctns, pcs -> viewModel.updateCartItemQuantity(id, ctns, pcs) },
                            onRemoveItem = { viewModel.removeCartItem(it) },
                            onClearCart = { viewModel.clearCart() },
                            onQuickPayCurrent = { viewModel.quickPayFullCurrentBill() },
                            onQuickPayTotal = { viewModel.quickPayFullTotalDue() },
                            onCheckout = { viewModel.checkoutInvoice { } }
                        )
                    }
                }
            }
        }
    }

    if (showNewCustomerDialog) {
        NewCustomerDialog(
            onDismiss = { showNewCustomerDialog = false },
            onConfirm = { name, phone, address, type, due, notes ->
                viewModel.addNewCustomer(name, phone, address, type, due, notes, autoSelectInPos = true)
                showNewCustomerDialog = false
            }
        )
    }
}

/**
 * Customer Selector, Bilingual Search and Product List Section
 */
@Composable
fun PosCustomerAndCatalogSection(
    selectedCustomer: CustomerEntity?,
    customers: List<CustomerEntity>,
    previousDue: Double,
    onSelectCustomer: (CustomerEntity?) -> Unit,
    onOpenAddCustomer: () -> Unit,
    customerDropdownExpanded: Boolean,
    onSetCustomerDropdown: (Boolean) -> Unit,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    companyFilter: String?,
    companies: List<String>,
    products: List<ProductEntity>,
    stockMap: Map<Long, Int>,
    lowStockIds: Set<Long>,
    languageMode: LanguageMode,
    onAddToCart: (ProductEntity, cartons: Int, pcs: Int) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Customer Selector + Previous Due Card (Module 2 Requirement)
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Customer / ক্রেতা নির্বাচন *",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Box {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color(0xFFF1F5F9))
                                    .clickable { onSetCustomerDropdown(true) }
                                    .padding(horizontal = 10.dp, vertical = 8.dp)
                                    .testTag("pos_customer_dropdown_btn"),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = selectedCustomer?.let { "${it.name} (${it.customerType})" }
                                        ?: "Select Customer (বাছাই করুন)",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Icon(Icons.Default.KeyboardArrowDown, contentDescription = null)
                            }

                            DropdownMenu(
                                expanded = customerDropdownExpanded,
                                onDismissRequest = { onSetCustomerDropdown(false) },
                                modifier = Modifier.fillMaxWidth(0.9f)
                            ) {
                                DropdownMenuItem(
                                    text = { Text("-- Walk-in / Cash Customer --") },
                                    onClick = {
                                        onSelectCustomer(null)
                                        onSetCustomerDropdown(false)
                                    }
                                )
                                customers.forEach { cust ->
                                    DropdownMenuItem(
                                        text = {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Column {
                                                    Text(cust.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                                    Text("${cust.customerType} • ${cust.phone} • ${cust.address}", fontSize = 10.sp, color = Color.Gray)
                                                }
                                                Text(
                                                    "Due: ৳${cust.currentDue.toInt()}",
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 12.sp,
                                                    color = if (cust.currentDue > 0) DueCrimson else PaidEmerald
                                                )
                                            }
                                        },
                                        onClick = {
                                            onSelectCustomer(cust)
                                            onSetCustomerDropdown(false)
                                        }
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // + Add Customer Button
                    Button(
                        onClick = onOpenAddCustomer,
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .height(44.dp)
                            .testTag("add_customer_billing_btn")
                    ) {
                        Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("+ New", fontSize = 12.sp)
                    }
                }

                // Show Previous Due Live Banner
                if (selectedCustomer != null) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (previousDue > 0) Color(0xFFFEF2F2) else Color(0xFFF0FDF4))
                            .padding(horizontal = 10.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Previous Due (পূর্বের বকেয়া): ",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (previousDue > 0) DueCrimson else PaidEmerald
                            )
                            Text(
                                text = "৳${previousDue.toInt()} TK",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black,
                                color = if (previousDue > 0) DueCrimson else PaidEmerald
                            )
                        }
                        Text(
                            text = "${selectedCustomer.customerType} • ${selectedCustomer.address}",
                            fontSize = 10.sp,
                            color = Color.DarkGray
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Bilingual Search Bar (English & Bangla Unicode)
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchChange,
            placeholder = { Text("Search toys in English / বাংলায় খুঁজুন (যেমন: কার, গান)...", fontSize = 12.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            trailingIcon = {
                if (searchQuery.isNotBlank()) {
                    IconButton(onClick = { onSearchChange("") }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear")
                    }
                }
            },
            singleLine = true,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("pos_search_input")
        )

        // Company Filter Chips (Module 1: Aman Plastic Toy, Jihan Toy Industries, etc.)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            FilterChip(
                selected = companyFilter == null,
                onClick = { onSelectCompanyFilter(null) },
                label = { Text("All Companies (${products.size})", fontSize = 11.sp) }
            )
            companies.forEach { comp ->
                FilterChip(
                    selected = companyFilter == comp,
                    onClick = { onSelectCompanyFilter(comp) },
                    label = { Text(comp, fontSize = 11.sp) }
                )
            }
        }

        // Product Catalog List
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(products, key = { it.id }) { product ->
                val totalStockPcs = stockMap[product.id] ?: 0
                val stockCartons = if (product.pcsPerCarton > 0) totalStockPcs / product.pcsPerCarton else 0
                val stockLoosePcs = if (product.pcsPerCarton > 0) totalStockPcs % product.pcsPerCarton else 0
                val isLowStock = lowStockIds.contains(product.id)

                PosProductCard(
                    product = product,
                    stockCartons = stockCartons,
                    stockLoosePcs = stockLoosePcs,
                    isLowStock = isLowStock,
                    languageMode = languageMode,
                    onAdd = { ctns, pcs -> onAddToCart(product, ctns, pcs) }
                )
            }
        }
    }
}

/**
 * Individual Product Card with Carton & Pcs units
 */
@Composable
fun PosProductCard(
    product: ProductEntity,
    stockCartons: Int,
    stockLoosePcs: Int,
    isLowStock: Boolean,
    languageMode: LanguageMode,
    onAdd: (cartons: Int, pcs: Int) -> Unit
) {
    var ctnCount by remember { mutableStateOf(1) }
    var looseCount by remember { mutableStateOf(0) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    // Bilingual Product Name
                    when (languageMode) {
                        LanguageMode.ENGLISH -> {
                            Text(product.nameEn, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        LanguageMode.BANGLA -> {
                            Text(product.nameBn, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        LanguageMode.BOTH -> {
                            Text(product.nameEn, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(product.nameBn, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                        }
                    }

                    // Company & Category
                    Row(
                        modifier = Modifier.padding(top = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = product.companyName,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = AccentTeal
                        )
                        Text(
                            text = " • ${product.category} • SKU: ${product.sku}",
                            fontSize = 10.sp,
                            color = Color.Gray
                        )
                    }
                }

                // Low Stock Badge
                if (isLowStock) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFFEF2F2))
                            .border(1.dp, DueCrimson, RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("Low Stock!", fontSize = 10.sp, color = DueCrimson, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Stock in Active Shop & Unit Rates
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF8FAFC), RoundedCornerShape(6.dp))
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Stock: Cartons + Loose Pcs
                Column {
                    Text("Current Stock:", fontSize = 9.sp, color = Color.Gray)
                    Text(
                        text = "$stockCartons Ctn + $stockLoosePcs Pcs",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isLowStock) DueCrimson else Color.Black
                    )
                    Text(
                        text = "1 Ctn = ${product.pcsPerCarton} Pcs",
                        fontSize = 9.sp,
                        color = Color.Gray
                    )
                }

                // Rates: Carton Rate & Pc Rate
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "৳${product.sellingPriceCarton.toInt()} / Ctn",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = PrimaryIndigo
                    )
                    Text(
                        text = "৳${product.sellingPricePc.toInt()} / Pc",
                        fontSize = 11.sp,
                        color = Color.DarkGray
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Carton & Pcs Stepper for fast adding to Cart
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Carton Stepper
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Ctn: ", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    IconButton(
                        onClick = { if (ctnCount > 0) ctnCount-- },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Decrease Ctn", modifier = Modifier.size(16.dp))
                    }
                    Text("$ctnCount", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    IconButton(
                        onClick = { ctnCount++ },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Increase Ctn", modifier = Modifier.size(16.dp))
                    }
                }

                // Loose Pcs Stepper
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Pc: ", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    IconButton(
                        onClick = { if (looseCount > 0) looseCount-- },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Decrease Pc", modifier = Modifier.size(16.dp))
                    }
                    Text("$looseCount", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    IconButton(
                        onClick = { looseCount++ },
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Increase Pc", modifier = Modifier.size(16.dp))
                    }
                }

                // Add to Cart Button
                Button(
                    onClick = {
                        if (ctnCount > 0 || looseCount > 0) {
                            onAdd(ctnCount, looseCount)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.height(34.dp).testTag("add_to_cart_btn_${product.id}")
                ) {
                    Icon(Icons.Default.AddShoppingCart, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add", fontSize = 11.sp)
                }
            }
        }
    }
}

/**
 * Cart List, Payment Methods & RUNNING DUE Billing Panel (Module 2)
 */
@Composable
fun PosCartAndBillingSection(
    cartItems: List<CartItem>,
    languageMode: LanguageMode,
    subtotal: Double,
    discount: Double,
    onDiscountChange: (Double) -> Unit,
    currentBill: Double,
    previousDue: Double,
    totalDue: Double,
    paidNowInput: String,
    onPaidNowChange: (String) -> Unit,
    billDue: Double,
    netTotalDue: Double,
    paymentMethod: String,
    onPaymentMethodChange: (String) -> Unit,
    selectedBank: String,
    onSelectedBankChange: (String) -> Unit,
    bankDropdownExpanded: Boolean,
    onSetBankDropdown: (Boolean) -> Unit,
    transactionId: String,
    onTransactionIdChange: (String) -> Unit,
    onUpdateQty: (productId: Long, cartons: Int, loosePcs: Int) -> Unit,
    onRemoveItem: (productId: Long) -> Unit,
    onClearCart: () -> Unit,
    onQuickPayCurrent: () -> Unit,
    onQuickPayTotal: () -> Unit,
    onCheckout: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Cart Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Cart Items (${cartItems.size})",
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )
            if (cartItems.isNotEmpty()) {
                Text(
                    text = "Clear Cart",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.clickable { onClearCart() }
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Cart Items Table
        if (cartItems.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp)
                    .background(Color.White, RoundedCornerShape(8.dp))
                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Cart is empty. Add toys from catalog.",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White, RoundedCornerShape(8.dp))
                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                cartItems.forEach { item ->
                    val pName = when (languageMode) {
                        LanguageMode.ENGLISH -> item.product.nameEn
                        LanguageMode.BANGLA -> item.product.nameBn
                        LanguageMode.BOTH -> "${item.product.nameEn} (${item.product.nameBn})"
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1.5f)) {
                            Text(pName, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(
                                "1 Ctn = ${item.product.pcsPerCarton} Pcs • ৳${item.ratePerCarton.toInt()}/ctn",
                                fontSize = 9.sp,
                                color = Color.Gray
                            )
                        }

                        // Steppers
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("${item.cartons}C ${item.loosePcs}P", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            IconButton(
                                onClick = { onRemoveItem(item.product.id) },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(Icons.Default.DeleteOutline, contentDescription = "Remove", tint = Color.Red, modifier = Modifier.size(16.dp))
                            }
                        }

                        Text(
                            "৳${item.totalAmount.toInt()}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.width(60.dp),
                            textAlign = TextAlign.End
                        )
                    }
                    HorizontalDivider(color = Color(0xFFF1F5F9))
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // RUNNING DUE BILLING CALCULATION CARD (Most Important Core Logic)
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Text(
                    text = "Billing & Running Due / হিসাব ও বকেয়া",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryIndigo
                )

                // Subtotal
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Subtotal:", fontSize = 12.sp, color = Color.DarkGray)
                    Text("৳${subtotal.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }

                // Discount Input
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Discount (ছাড়):", fontSize = 12.sp, color = Color.DarkGray)
                    OutlinedTextField(
                        value = if (discount == 0.0) "" else discount.toInt().toString(),
                        onValueChange = { onDiscountChange(it.toDoubleOrNull() ?: 0.0) },
                        placeholder = { Text("0") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.width(90.dp).height(46.dp).testTag("pos_discount_input")
                    )
                }

                HorizontalDivider()

                // CURRENT BILL
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Current Bill (বর্তমান বিল):", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("৳${currentBill.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }

                // PREVIOUS DUE (Auto show Previous Due)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Previous Due (পূর্বের বকেয়া):", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = DueCrimson)
                    Text("৳${previousDue.toInt()}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = DueCrimson)
                }

                // TOTAL DUE = PREVIOUS DUE + CURRENT BILL (Example: 20000 + 100000 = 120000)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFFEF3C7), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("TOTAL DUE (পূর্বের + বর্তমান বিল):", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF92400E))
                    Text("৳${totalDue.toInt()}", fontSize = 13.sp, fontWeight = FontWeight.Black, color = Color(0xFF92400E))
                }

                HorizontalDivider()

                // PAID NOW INPUT (Example: 60000)
                Text("Paid Now (এখন জমা দেওয়া হয়েছে) *:", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = paidNowInput,
                    onValueChange = onPaidNowChange,
                    placeholder = { Text("Enter Paid Amount (TK)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("pos_paid_now_input")
                )

                // Quick Pay Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    OutlinedButton(
                        onClick = onQuickPayCurrent,
                        modifier = Modifier.weight(1f).height(36.dp)
                    ) {
                        Text("Pay Bill (৳${currentBill.toInt()})", fontSize = 10.sp)
                    }
                    OutlinedButton(
                        onClick = onQuickPayTotal,
                        modifier = Modifier.weight(1f).height(36.dp)
                    ) {
                        Text("Pay Total (৳${totalDue.toInt()})", fontSize = 10.sp)
                    }
                }

                // Payment Method: Cash, Bank (All Bangladeshi Banks list), bKash, Nagad, Rocket, Upay
                Text("Payment Method (পেমেন্ট মাধ্যম):", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf("Cash", "bKash", "Nagad", "Bank", "Rocket", "Upay").forEach { method ->
                        FilterChip(
                            selected = paymentMethod == method,
                            onClick = { onPaymentMethodChange(method) },
                            label = { Text(method, fontSize = 11.sp) },
                            modifier = Modifier.testTag("method_${method.lowercase()}")
                        )
                    }
                }

                // If Bank selected, show All Bangladeshi Banks list
                if (paymentMethod == "Bank") {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = selectedBank,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Select Bangladeshi Bank") },
                            trailingIcon = { Icon(Icons.Default.KeyboardArrowDown, contentDescription = null) },
                            modifier = Modifier.fillMaxWidth()
                        )
                        Box(
                            modifier = Modifier
                                .matchParentSize()
                                .clickable { onSetBankDropdown(true) }
                        )
                        DropdownMenu(
                            expanded = bankDropdownExpanded,
                            onDismissRequest = { onSetBankDropdown(false) }
                        ) {
                            BangladeshBanks.ALL_BANKS.forEach { bank ->
                                DropdownMenuItem(
                                    text = { Text(bank) },
                                    onClick = {
                                        onSelectedBankChange(bank)
                                        onSetBankDropdown(false)
                                    }
                                )
                            }
                        }
                    }
                }

                // Transaction ID / Reference
                if (paymentMethod != "Cash") {
                    OutlinedTextField(
                        value = transactionId,
                        onValueChange = onTransactionIdChange,
                        label = { Text("Transaction ID / Cheque #") },
                        placeholder = { Text("e.g. TrxID 9X82K or Cheque #") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("pos_trx_id_input")
                    )
                }

                HorizontalDivider()

                // DUE OF THIS BILL & NEW NET DUE
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Due of this Bill (এই বিলের বকেয়া):", fontSize = 11.sp, color = Color.DarkGray)
                    Text("৳${billDue.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }

                // NEW NET DUE = TOTAL DUE - PAID NOW (Example: 120000 - 60000 = 60000 auto add to ledger)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFFEF2F2), RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "NEW NET TOTAL DUE:",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Black,
                            color = DueCrimson
                        )
                        Text(
                            text = "(Auto added to Customer Ledger)",
                            fontSize = 9.sp,
                            color = Color.DarkGray
                        )
                    }
                    Text(
                        text = "৳${netTotalDue.toInt()}",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black,
                        color = DueCrimson
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // CHECKOUT BUTTON
        Button(
            onClick = onCheckout,
            enabled = cartItems.isNotEmpty(),
            colors = ButtonDefaults.buttonColors(containerColor = PaidEmerald),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .testTag("pos_checkout_btn")
        ) {
            Icon(Icons.Default.PointOfSale, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "CONFIRM & PRINT INVOICE (৳${currentBill.toInt()})",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp
            )
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}
