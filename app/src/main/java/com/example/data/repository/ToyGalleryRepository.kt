package com.example.data.repository

import com.example.data.local.AppDatabase
import com.example.data.local.entity.CompanyEntity
import com.example.data.local.entity.CustomerEntity
import com.example.data.local.entity.CustomerLedgerEntity
import com.example.data.local.entity.InvoiceEntity
import com.example.data.local.entity.InvoiceItemEntity
import com.example.data.local.entity.ProductEntity
import com.example.data.local.entity.ShopEntity
import com.example.data.local.entity.ShopStockEntity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ToyGalleryRepository(private val database: AppDatabase) {

    private val shopDao = database.shopDao()
    private val companyDao = database.companyDao()
    private val productDao = database.productDao()
    private val stockDao = database.stockDao()
    private val customerDao = database.customerDao()
    private val invoiceDao = database.invoiceDao()

    val allShops: Flow<List<ShopEntity>> = shopDao.getAllShops()
    val allCompanies: Flow<List<CompanyEntity>> = companyDao.getAllCompanies()
    val allProducts: Flow<List<ProductEntity>> = productDao.getAllProducts()
    val allCustomers: Flow<List<CustomerEntity>> = customerDao.getAllCustomers()
    val allInvoices: Flow<List<InvoiceEntity>> = invoiceDao.getAllInvoices()
    val allStocks: Flow<List<ShopStockEntity>> = stockDao.getAllStock()

    fun getStockForShop(shopId: Long): Flow<List<ShopStockEntity>> = stockDao.getStockForShop(shopId)
    fun getLedgerForCustomer(customerId: Long): Flow<List<CustomerLedgerEntity>> = customerDao.getLedgerForCustomer(customerId)
    fun getInvoiceItems(invoiceId: Long): Flow<List<InvoiceItemEntity>> = invoiceDao.getInvoiceItems(invoiceId)

    suspend fun ensureInitialData() = withContext(Dispatchers.IO) {
        val existingShops = shopDao.getAllShops().firstOrNull()
        if (existingShops.isNullOrEmpty()) {
            AppDatabase.seedInitialData(database)
        }
    }

    suspend fun addShop(shop: ShopEntity): Long = withContext(Dispatchers.IO) {
        val id = shopDao.insertShop(shop)
        // Initialize stock 0 for all existing products in this new shop
        val products = productDao.getAllProducts().firstOrNull().orEmpty()
        val stocks = products.map { Product ->
            ShopStockEntity(shopId = id, productId = Product.id, totalPcs = 0)
        }
        stockDao.insertOrUpdateStocks(stocks)
        id
    }

    suspend fun updateShop(shop: ShopEntity) = withContext(Dispatchers.IO) {
        shopDao.updateShop(shop)
    }

    suspend fun addCompany(company: CompanyEntity): Long = withContext(Dispatchers.IO) {
        companyDao.insertCompany(company)
    }

    suspend fun updateCompany(company: CompanyEntity) = withContext(Dispatchers.IO) {
        companyDao.updateCompany(company)
    }

    suspend fun addProduct(product: ProductEntity, initialCartons: Int = 0, initialPcs: Int = 0, targetShopId: Long = 1): Long = withContext(Dispatchers.IO) {
        val productId = productDao.insertProduct(product)
        val allShopsList = shopDao.getAllShops().firstOrNull().orEmpty()
        val initialTotalPcs = (initialCartons * product.pcsPerCarton) + initialPcs
        allShopsList.forEach { shop ->
            val qty = if (shop.id == targetShopId) initialTotalPcs else 0
            stockDao.insertOrUpdateStock(
                ShopStockEntity(
                    shopId = shop.id,
                    productId = productId,
                    totalPcs = qty
                )
            )
        }
        productId
    }

    suspend fun updateProduct(product: ProductEntity) = withContext(Dispatchers.IO) {
        productDao.updateProduct(product)
    }

    suspend fun updateStock(shopId: Long, productId: Long, newTotalPcs: Int) = withContext(Dispatchers.IO) {
        stockDao.insertOrUpdateStock(
            ShopStockEntity(shopId = shopId, productId = productId, totalPcs = newTotalPcs)
        )
    }

    suspend fun addStock(shopId: Long, productId: Long, addCartons: Int, addPcs: Int, pcsPerCarton: Int) = withContext(Dispatchers.IO) {
        val existing = stockDao.getStock(shopId, productId)?.totalPcs ?: 0
        val addedPcs = (addCartons * pcsPerCarton) + addPcs
        stockDao.insertOrUpdateStock(
            ShopStockEntity(shopId = shopId, productId = productId, totalPcs = existing + addedPcs)
        )
    }

    suspend fun addCustomer(customer: CustomerEntity): Long = withContext(Dispatchers.IO) {
        val customerId = customerDao.insertCustomer(customer)
        if (customer.currentDue > 0) {
            customerDao.insertLedgerEntry(
                CustomerLedgerEntity(
                    customerId = customerId,
                    date = System.currentTimeMillis(),
                    type = "OPENING_DUE",
                    reference = "Opening Due Balance",
                    debit = customer.currentDue,
                    credit = 0.0,
                    balance = customer.currentDue,
                    notes = "Initial opening due"
                )
            )
        }
        customerId
    }

    suspend fun updateCustomer(customer: CustomerEntity) = withContext(Dispatchers.IO) {
        customerDao.updateCustomer(customer)
    }

    /**
     * Module 2: Complete Sales & Invoicing with Running Due Logic
     *
     * Example:
     * - Previous Due: 20,000 TK
     * - Current Bill: 100,000 TK
     * - Total Due = Previous Due + Current Bill = 120,000 TK
     * - Paid Now: 60,000 TK (with payment method + Txn ID)
     * - New Net Due = Total Due - Paid Now = 60,000 TK
     *
     * Auto deducts stock from the active shop.
     * Auto appends to Customer Ledger with running balance.
     */
    suspend fun processSaleInvoice(
        shop: ShopEntity,
        customer: CustomerEntity,
        items: List<InvoiceItemEntity>,
        discount: Double,
        paidNow: Double,
        paymentMethod: String,
        bankName: String,
        transactionId: String,
        notes: String
    ): InvoiceEntity = withContext(Dispatchers.IO) {
        val subtotal = items.sumOf { it.totalAmount }
        val currentBill = (subtotal - discount).coerceAtLeast(0.0)
        val previousDue = customer.currentDue
        val totalDue = previousDue + currentBill
        val billDue = (currentBill - paidNow).coerceAtLeast(0.0)
        val newNetDue = (totalDue - paidNow).coerceAtLeast(0.0)

        val timestamp = System.currentTimeMillis()
        val dateStr = SimpleDateFormat("yyMMdd", Locale.getDefault()).format(Date(timestamp))
        val randomSuffix = (1000..9999).random()
        val invoiceNo = "TG-$dateStr-$randomSuffix"

        val invoice = InvoiceEntity(
            invoiceNumber = invoiceNo,
            shopId = shop.id,
            shopName = shop.name,
            shopAddress = shop.address,
            customerId = customer.id,
            customerName = customer.name,
            customerPhone = customer.phone,
            customerType = customer.customerType,
            date = timestamp,
            totalItems = items.size,
            currentBill = currentBill,
            discount = discount,
            previousDue = previousDue,
            totalDue = totalDue,
            paidNow = paidNow,
            paymentMethod = paymentMethod,
            bankName = bankName,
            transactionId = transactionId,
            billDue = billDue,
            netTotalDue = newNetDue,
            notes = notes
        )

        val invoiceId = invoiceDao.insertInvoice(invoice)

        // Save items with the generated invoiceId
        val itemsWithId = items.map { it.copy(invoiceId = invoiceId) }
        invoiceDao.insertInvoiceItems(itemsWithId)

        // Deduct inventory from the selected shop
        for (item in itemsWithId) {
            val currentStock = stockDao.getStock(shop.id, item.productId)?.totalPcs ?: 0
            val remainingStock = (currentStock - item.totalPcs).coerceAtLeast(0)
            stockDao.updateStockQty(shop.id, item.productId, remainingStock)
        }

        // Update customer running due
        customerDao.updateCustomerDue(customer.id, newNetDue)

        // Add ledger entries for audit trail
        var runningBal = previousDue
        if (currentBill > 0) {
            runningBal += currentBill
            customerDao.insertLedgerEntry(
                CustomerLedgerEntity(
                    customerId = customer.id,
                    date = timestamp,
                    type = "INVOICE",
                    reference = "Invoice #$invoiceNo",
                    debit = currentBill,
                    credit = 0.0,
                    balance = runningBal,
                    notes = "Sale: ${items.size} items (Shop: ${shop.name})"
                )
            )
        }

        if (paidNow > 0) {
            runningBal -= paidNow
            val payRef = buildString {
                append("Payment ($paymentMethod)")
                if (bankName.isNotBlank()) append(" - $bankName")
                if (transactionId.isNotBlank()) append(" Trx: $transactionId")
            }
            customerDao.insertLedgerEntry(
                CustomerLedgerEntity(
                    customerId = customer.id,
                    date = timestamp + 1, // ensure chronological order
                    type = "PAYMENT",
                    reference = payRef,
                    debit = 0.0,
                    credit = paidNow,
                    balance = runningBal,
                    notes = "Paid against Invoice #$invoiceNo"
                )
            )
        }

        invoice.copy(id = invoiceId)
    }

    /**
     * Standalone Due Collection for an existing customer from Customer Register
     */
    suspend fun collectCustomerDue(
        customer: CustomerEntity,
        amount: Double,
        paymentMethod: String,
        bankName: String,
        transactionId: String,
        notes: String
    ): Double = withContext(Dispatchers.IO) {
        val prevDue = customer.currentDue
        val newDue = (prevDue - amount).coerceAtLeast(0.0)
        customerDao.updateCustomerDue(customer.id, newDue)

        val timestamp = System.currentTimeMillis()
        val payRef = buildString {
            append("Due Collection ($paymentMethod)")
            if (bankName.isNotBlank()) append(" - $bankName")
            if (transactionId.isNotBlank()) append(" Trx: $transactionId")
        }

        customerDao.insertLedgerEntry(
            CustomerLedgerEntity(
                customerId = customer.id,
                date = timestamp,
                type = "PAYMENT",
                reference = payRef,
                debit = 0.0,
                credit = amount,
                balance = newDue,
                notes = notes.ifBlank { "Manual Due Collection" }
            )
        )
        newDue
    }

    /**
     * Generates CSV with UTF-8 BOM so Bangla Unicode renders cleanly in Microsoft Excel
     */
    suspend fun exportProductsCsvWithBom(products: List<ProductEntity>, stocksMap: Map<Long, Int>): String = withContext(Dispatchers.IO) {
        val bom = "\uFEFF"
        val sb = StringBuilder(bom)
        sb.append("SKU,Product Name (English),Product Name (Bangla),Company,Category,Carton Size (Pcs),Stock Cartons,Stock Loose Pcs,Total Pcs,Purchase Rate (Ctn),Selling Rate (Ctn),Selling Rate (Pc),Low Stock Threshold (Ctn)\n")
        for (p in products) {
            val totalPcs = stocksMap[p.id] ?: 0
            val ctns = if (p.pcsPerCarton > 0) totalPcs / p.pcsPerCarton else 0
            val pcs = if (p.pcsPerCarton > 0) totalPcs % p.pcsPerCarton else 0
            sb.append("\"${p.sku}\",")
            sb.append("\"${p.nameEn.replace("\"", "\"\"")}\",")
            sb.append("\"${p.nameBn.replace("\"", "\"\"")}\",")
            sb.append("\"${p.companyName}\",")
            sb.append("\"${p.category}\",")
            sb.append("${p.pcsPerCarton},")
            sb.append("$ctns,")
            sb.append("$pcs,")
            sb.append("$totalPcs,")
            sb.append("${p.purchasePriceCarton},")
            sb.append("${p.sellingPriceCarton},")
            sb.append("${p.sellingPricePc},")
            sb.append("${p.lowStockThresholdCartons}\n")
        }
        sb.toString()
    }

    /**
     * Generates Customer Register & Ledger CSV with UTF-8 BOM
     */
    suspend fun exportCustomerLedgerCsvWithBom(customer: CustomerEntity, ledger: List<CustomerLedgerEntity>): String = withContext(Dispatchers.IO) {
        val bom = "\uFEFF"
        val sb = StringBuilder(bom)
        sb.append("Customer:,\"${customer.name}\",Phone:,\"${customer.phone}\",Type:,\"${customer.customerType}\",Current Due:,\"${customer.currentDue} TK\"\n\n")
        sb.append("Date,Type,Reference / Description,Debit (Bill TK),Credit (Paid TK),Running Balance (Due TK),Notes\n")
        val sdf = SimpleDateFormat("dd-MMM-yyyy hh:mm a", Locale.getDefault())
        for (item in ledger) {
            sb.append("\"${sdf.format(Date(item.date))}\",")
            sb.append("\"${item.type}\",")
            sb.append("\"${item.reference.replace("\"", "\"\"")}\",")
            sb.append("${item.debit},")
            sb.append("${item.credit},")
            sb.append("${item.balance},")
            sb.append("\"${item.notes.replace("\"", "\"\"")}\"\n")
        }
        sb.toString()
    }
}
