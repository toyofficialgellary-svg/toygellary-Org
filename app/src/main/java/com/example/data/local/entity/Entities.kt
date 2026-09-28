package com.example.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Multi-Shop Management: Allows unlimited branches / outlets / godowns
 */
@Entity(tableName = "shops")
data class ShopEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val address: String,
    val phone: String,
    val isMain: Boolean = false,
    val isActive: Boolean = true
)

/**
 * Toy Manufacturing & Distribution Companies (e.g. Aman Plastic Toy, Jihan Toy Industries)
 */
@Entity(tableName = "companies")
data class CompanyEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val contactPerson: String = "",
    val phone: String = "",
    val address: String = ""
)

/**
 * Product Master with Full Bilingual Support (English & Bangla Unicode)
 * and Carton & Pcs conversion
 */
@Entity(
    tableName = "products",
    indices = [Index(value = ["sku"], unique = true)]
)
data class ProductEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val sku: String,
    val nameEn: String,
    val nameBn: String,
    val companyId: Long,
    val companyName: String,
    val category: String,
    val pcsPerCarton: Int = 50, // e.g. 1 Carton = 50 Pcs
    val purchasePriceCarton: Double = 0.0,
    val purchasePricePc: Double = 0.0,
    val sellingPriceCarton: Double = 0.0,
    val sellingPricePc: Double = 0.0,
    val lowStockThresholdCartons: Int = 5,
    val description: String = ""
)

/**
 * Stock inventory tracked per Shop and Product in Total Pieces
 * Carton and Loose Pcs can be derived dynamically:
 * Cartons = totalPcs / pcsPerCarton
 * Loose Pcs = totalPcs % pcsPerCarton
 */
@Entity(
    tableName = "shop_stock",
    primaryKeys = ["shopId", "productId"]
)
data class ShopStockEntity(
    val shopId: Long,
    val productId: Long,
    val totalPcs: Int = 0
)

/**
 * Customer Register: Local (Chittagong) & Outside
 * Tracks Running Net Due
 */
@Entity(tableName = "customers")
data class CustomerEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val phone: String,
    val address: String,
    val customerType: String = "LOCAL", // "LOCAL" or "OUTSIDE"
    val currentDue: Double = 0.0, // Running Net Due
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis()
)

/**
 * Customer Ledger - Historical audit trail of all invoices, payments, and due adjustments
 */
@Entity(
    tableName = "customer_ledger",
    indices = [Index(value = ["customerId"])]
)
data class CustomerLedgerEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val customerId: Long,
    val date: Long = System.currentTimeMillis(),
    val type: String, // "INVOICE", "PAYMENT", "OPENING_DUE"
    val reference: String, // e.g. "Invoice #TG-1001", "Cash Collection", "bKash Trx 9X82K"
    val debit: Double = 0.0, // Bill amount added
    val credit: Double = 0.0, // Payment amount received
    val balance: Double = 0.0, // Running balance after this entry
    val notes: String = ""
)

/**
 * Sales Invoice with Running Due Logic
 */
@Entity(tableName = "invoices")
data class InvoiceEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val invoiceNumber: String,
    val shopId: Long,
    val shopName: String,
    val shopAddress: String,
    val customerId: Long,
    val customerName: String,
    val customerPhone: String,
    val customerType: String,
    val date: Long = System.currentTimeMillis(),
    val totalItems: Int = 0,
    val currentBill: Double = 0.0,
    val discount: Double = 0.0,
    val previousDue: Double = 0.0,
    val totalDue: Double = 0.0, // previousDue + currentBill
    val paidNow: Double = 0.0,
    val paymentMethod: String = "Cash", // Cash, Bank, bKash, Nagad, Rocket, Upay
    val bankName: String = "",
    val transactionId: String = "",
    val billDue: Double = 0.0, // currentBill - paidNow
    val netTotalDue: Double = 0.0, // totalDue - paidNow
    val notes: String = ""
)

/**
 * Line items for an Invoice
 */
@Entity(
    tableName = "invoice_items",
    indices = [Index(value = ["invoiceId"])]
)
data class InvoiceItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val invoiceId: Long,
    val productId: Long,
    val productNameEn: String,
    val productNameBn: String,
    val companyName: String,
    val pcsPerCarton: Int,
    val cartonsQuantity: Int = 0,
    val pcsQuantity: Int = 0,
    val totalPcs: Int = 0,
    val ratePerCarton: Double = 0.0,
    val ratePerPc: Double = 0.0,
    val totalAmount: Double = 0.0
)
