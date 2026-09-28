package com.example.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.example.data.local.entity.CompanyEntity
import com.example.data.local.entity.CustomerEntity
import com.example.data.local.entity.CustomerLedgerEntity
import com.example.data.local.entity.InvoiceEntity
import com.example.data.local.entity.InvoiceItemEntity
import com.example.data.local.entity.ProductEntity
import com.example.data.local.entity.ShopEntity
import com.example.data.local.entity.ShopStockEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ShopDao {
    @Query("SELECT * FROM shops ORDER BY isMain DESC, id ASC")
    fun getAllShops(): Flow<List<ShopEntity>>

    @Query("SELECT * FROM shops WHERE id = :id LIMIT 1")
    fun getShopById(id: Long): Flow<ShopEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShop(shop: ShopEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertShops(shops: List<ShopEntity>)

    @Update
    suspend fun updateShop(shop: ShopEntity)

    @Delete
    suspend fun deleteShop(shop: ShopEntity)
}

@Dao
interface CompanyDao {
    @Query("SELECT * FROM companies ORDER BY name ASC")
    fun getAllCompanies(): Flow<List<CompanyEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCompany(company: CompanyEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCompanies(companies: List<CompanyEntity>)

    @Update
    suspend fun updateCompany(company: CompanyEntity)

    @Delete
    suspend fun deleteCompany(company: CompanyEntity)
}

@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY nameEn ASC")
    fun getAllProducts(): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE id = :id LIMIT 1")
    fun getProductById(id: Long): Flow<ProductEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: ProductEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProducts(products: List<ProductEntity>)

    @Update
    suspend fun updateProduct(product: ProductEntity)

    @Delete
    suspend fun deleteProduct(product: ProductEntity)
}

@Dao
interface StockDao {
    @Query("SELECT * FROM shop_stock WHERE shopId = :shopId")
    fun getStockForShop(shopId: Long): Flow<List<ShopStockEntity>>

    @Query("SELECT * FROM shop_stock")
    fun getAllStock(): Flow<List<ShopStockEntity>>

    @Query("SELECT * FROM shop_stock WHERE shopId = :shopId AND productId = :productId LIMIT 1")
    suspend fun getStock(shopId: Long, productId: Long): ShopStockEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateStock(stock: ShopStockEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateStocks(stocks: List<ShopStockEntity>)

    @Query("UPDATE shop_stock SET totalPcs = :newTotalPcs WHERE shopId = :shopId AND productId = :productId")
    suspend fun updateStockQty(shopId: Long, productId: Long, newTotalPcs: Int)
}

@Dao
interface CustomerDao {
    @Query("SELECT * FROM customers ORDER BY currentDue DESC, name ASC")
    fun getAllCustomers(): Flow<List<CustomerEntity>>

    @Query("SELECT * FROM customers WHERE id = :id LIMIT 1")
    fun getCustomerById(id: Long): Flow<CustomerEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomer(customer: CustomerEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomers(customers: List<CustomerEntity>)

    @Update
    suspend fun updateCustomer(customer: CustomerEntity)

    @Query("UPDATE customers SET currentDue = :newDue WHERE id = :customerId")
    suspend fun updateCustomerDue(customerId: Long, newDue: Double)

    @Delete
    suspend fun deleteCustomer(customer: CustomerEntity)

    @Query("SELECT * FROM customer_ledger WHERE customerId = :customerId ORDER BY date DESC, id DESC")
    fun getLedgerForCustomer(customerId: Long): Flow<List<CustomerLedgerEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLedgerEntry(entry: CustomerLedgerEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLedgerEntries(entries: List<CustomerLedgerEntity>)
}

@Dao
interface InvoiceDao {
    @Query("SELECT * FROM invoices ORDER BY date DESC, id DESC")
    fun getAllInvoices(): Flow<List<InvoiceEntity>>

    @Query("SELECT * FROM invoices WHERE id = :id LIMIT 1")
    fun getInvoiceById(id: Long): Flow<InvoiceEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInvoice(invoice: InvoiceEntity): Long

    @Query("SELECT * FROM invoice_items WHERE invoiceId = :invoiceId")
    fun getInvoiceItems(invoiceId: Long): Flow<List<InvoiceItemEntity>>

    @Query("SELECT * FROM invoice_items WHERE invoiceId = :invoiceId")
    suspend fun getInvoiceItemsSync(invoiceId: Long): List<InvoiceItemEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInvoiceItems(items: List<InvoiceItemEntity>)
}
