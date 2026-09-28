package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.data.local.dao.CompanyDao
import com.example.data.local.dao.CustomerDao
import com.example.data.local.dao.InvoiceDao
import com.example.data.local.dao.ProductDao
import com.example.data.local.dao.ShopDao
import com.example.data.local.dao.StockDao
import com.example.data.local.entity.CompanyEntity
import com.example.data.local.entity.CustomerEntity
import com.example.data.local.entity.CustomerLedgerEntity
import com.example.data.local.entity.InvoiceEntity
import com.example.data.local.entity.InvoiceItemEntity
import com.example.data.local.entity.ProductEntity
import com.example.data.local.entity.ShopEntity
import com.example.data.local.entity.ShopStockEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        ShopEntity::class,
        CompanyEntity::class,
        ProductEntity::class,
        ShopStockEntity::class,
        CustomerEntity::class,
        CustomerLedgerEntity::class,
        InvoiceEntity::class,
        InvoiceItemEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun shopDao(): ShopDao
    abstract fun companyDao(): CompanyDao
    abstract fun productDao(): ProductDao
    abstract fun stockDao(): StockDao
    abstract fun customerDao(): CustomerDao
    abstract fun invoiceDao(): InvoiceDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "toy_gallery_pos.db"
                ).addCallback(DatabaseCallback())
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    CoroutineScope(Dispatchers.IO).launch {
                        seedInitialData(database)
                    }
                }
            }
        }

        suspend fun seedInitialData(database: AppDatabase) {
            val shopDao = database.shopDao()
            val companyDao = database.companyDao()
            val productDao = database.productDao()
            val stockDao = database.stockDao()
            val customerDao = database.customerDao()
            val invoiceDao = database.invoiceDao()

            // 1. Initial Shops (Multi-Shop Management)
            val shop1Id = shopDao.insertShop(
                ShopEntity(
                    id = 1,
                    name = "Toy Gallery (Main Showroom)",
                    address = "Jalsa Market 2nd Floor, Riazuddin Bazar, Chittagong",
                    phone = "01819-556677",
                    isMain = true,
                    isActive = true
                )
            )
            val shop2Id = shopDao.insertShop(
                ShopEntity(
                    id = 2,
                    name = "Toy Gallery (Branch 2)",
                    address = "Terribazar Commercial Area, Chittagong",
                    phone = "01711-223344",
                    isMain = false,
                    isActive = true
                )
            )
            val shop3Id = shopDao.insertShop(
                ShopEntity(
                    id = 3,
                    name = "Central Godown / Warehouse",
                    address = "Khatunganj Wholesale Hub, Chittagong",
                    phone = "01912-889900",
                    isMain = false,
                    isActive = true
                )
            )

            // 2. Initial Companies (Suppliers)
            val comp1Id = companyDao.insertCompany(
                CompanyEntity(
                    id = 1,
                    name = "Aman Plastic Toy",
                    contactPerson = "Md. Amanullah",
                    phone = "01715-112233",
                    address = "Kamrangirchar, Dhaka"
                )
            )
            val comp2Id = companyDao.insertCompany(
                CompanyEntity(
                    id = 2,
                    name = "Jihan Toy Industries",
                    contactPerson = "Engr. Jihan Ahmed",
                    phone = "01814-445566",
                    address = "Gazipur Industrial Zone, Dhaka"
                )
            )
            val comp3Id = companyDao.insertCompany(
                CompanyEntity(
                    id = 3,
                    name = "Dhaka Toy Mart",
                    contactPerson = "Haji Rafiqul Islam",
                    phone = "01911-778899",
                    address = "Chawkbazar, Old Dhaka"
                )
            )
            val comp4Id = companyDao.insertCompany(
                CompanyEntity(
                    id = 4,
                    name = "China Import Direct Chittagong",
                    contactPerson = "Farhad Hossain (Owner)",
                    phone = "01819-556677",
                    address = "Agrabad C/A, Chittagong"
                )
            )

            // 3. Initial Products with Bilingual Names & Carton/Pcs Units
            val products = listOf(
                ProductEntity(
                    id = 1,
                    sku = "TG-APT-01",
                    nameEn = "Remote Control Super Racing Car",
                    nameBn = "রিমোট কন্ট্রোল সুপার রেসিং কার",
                    companyId = 1,
                    companyName = "Aman Plastic Toy",
                    category = "Vehicles & RC",
                    pcsPerCarton = 24,
                    purchasePriceCarton = 9600.0,
                    purchasePricePc = 400.0,
                    sellingPriceCarton = 12000.0,
                    sellingPricePc = 550.0,
                    lowStockThresholdCartons = 5,
                    description = "High speed rechargeable RC racing car with LED lights"
                ),
                ProductEntity(
                    id = 2,
                    sku = "TG-APT-02",
                    nameEn = "Water Gun Blaster 500ml",
                    nameBn = "ওয়াটার গান ব্লাস্টার ৫০০ মি.লি.",
                    companyId = 1,
                    companyName = "Aman Plastic Toy",
                    category = "Summer & Outdoor",
                    pcsPerCarton = 50,
                    purchasePriceCarton = 5500.0,
                    purchasePricePc = 110.0,
                    sellingPriceCarton = 7500.0,
                    sellingPricePc = 160.0,
                    lowStockThresholdCartons = 8,
                    description = "High capacity pressure pump water gun"
                ),
                ProductEntity(
                    id = 3,
                    sku = "TG-JTI-01",
                    nameEn = "Baby Walker Deluxe Musical",
                    nameBn = "মিউজিক্যাল বেবি ওয়াকার ডিলাক্স",
                    companyId = 2,
                    companyName = "Jihan Toy Industries",
                    category = "Baby Gear & Walkers",
                    pcsPerCarton = 6,
                    purchasePriceCarton = 7200.0,
                    purchasePricePc = 1200.0,
                    sellingPriceCarton = 9600.0,
                    sellingPricePc = 1750.0,
                    lowStockThresholdCartons = 4,
                    description = "Adjustable height walker with rattle and nursery rhymes"
                ),
                ProductEntity(
                    id = 4,
                    sku = "TG-JTI-02",
                    nameEn = "Die-Cast Metal Model Cars (Set of 6)",
                    nameBn = "ডাই-কাস্ট মেটাল কার সেট",
                    companyId = 2,
                    companyName = "Jihan Toy Industries",
                    category = "Die-Cast & Models",
                    pcsPerCarton = 40,
                    purchasePriceCarton = 11200.0,
                    purchasePricePc = 280.0,
                    sellingPriceCarton = 14400.0,
                    sellingPricePc = 390.0,
                    lowStockThresholdCartons = 6,
                    description = "Heavy metal pull-back sports cars"
                ),
                ProductEntity(
                    id = 5,
                    sku = "TG-APT-03",
                    nameEn = "Building Blocks 500 Pcs Bucket",
                    nameBn = "বিল্ডিং ব্লক ৫০০ পিস সেট",
                    companyId = 1,
                    companyName = "Aman Plastic Toy",
                    category = "Educational & Blocks",
                    pcsPerCarton = 12,
                    purchasePriceCarton = 5400.0,
                    purchasePricePc = 450.0,
                    sellingPriceCarton = 7200.0,
                    sellingPricePc = 650.0,
                    lowStockThresholdCartons = 5,
                    description = "Educational creative plastic interlocking bricks"
                ),
                ProductEntity(
                    id = 6,
                    sku = "TG-JTI-03",
                    nameEn = "Doctor Set Play Suitcase",
                    nameBn = "ডক্টর প্লে সেট সুটকেস",
                    companyId = 2,
                    companyName = "Jihan Toy Industries",
                    category = "Roleplay & Pretend",
                    pcsPerCarton = 48,
                    purchasePriceCarton = 7200.0,
                    purchasePricePc = 150.0,
                    sellingPriceCarton = 9600.0,
                    sellingPricePc = 220.0,
                    lowStockThresholdCartons = 6,
                    description = "Medical toys with stethoscope and thermometer"
                ),
                ProductEntity(
                    id = 7,
                    sku = "TG-DTM-01",
                    nameEn = "Talking Tom Interactive Plush",
                    nameBn = "টকিং টম ইন্টারেক্টিভ খেলনা",
                    companyId = 3,
                    companyName = "Dhaka Toy Mart",
                    category = "Plush & Dolls",
                    pcsPerCarton = 30,
                    purchasePriceCarton = 8400.0,
                    purchasePricePc = 280.0,
                    sellingPriceCarton = 10800.0,
                    sellingPricePc = 400.0,
                    lowStockThresholdCartons = 5,
                    description = "Voice recording and mimicking talking cat toy"
                ),
                ProductEntity(
                    id = 8,
                    sku = "TG-CID-01",
                    nameEn = "Automatic Bubble Machine Gun",
                    nameBn = "অটোমেটিক বাবল মেশিন গান",
                    companyId = 4,
                    companyName = "China Import Direct Chittagong",
                    category = "Summer & Outdoor",
                    pcsPerCarton = 60,
                    purchasePriceCarton = 6600.0,
                    purchasePricePc = 110.0,
                    sellingPriceCarton = 9000.0,
                    sellingPricePc = 165.0,
                    lowStockThresholdCartons = 7,
                    description = "Gatling style 32-hole continuous bubble gun"
                )
            )
            productDao.insertProducts(products)

            // 4. Initial Stock in Shops (Shop 1: Main Showroom, Shop 2: Branch 2, Shop 3: Godown)
            val stocks = listOf(
                // Shop 1 (Main Showroom)
                ShopStockEntity(shopId = 1, productId = 1, totalPcs = 12 * 24 + 10), // 12 Ctns + 10 Pcs
                ShopStockEntity(shopId = 1, productId = 2, totalPcs = 4 * 50 + 20),  // 4 Ctns + 20 Pcs (Low stock! Threshold is 8 Ctns)
                ShopStockEntity(shopId = 1, productId = 3, totalPcs = 2 * 6 + 1),   // 2 Ctns + 1 Pc (Low stock! Threshold is 4 Ctns)
                ShopStockEntity(shopId = 1, productId = 4, totalPcs = 15 * 40 + 5),  // 15 Ctns + 5 Pcs
                ShopStockEntity(shopId = 1, productId = 5, totalPcs = 10 * 12 + 4),  // 10 Ctns + 4 Pcs
                ShopStockEntity(shopId = 1, productId = 6, totalPcs = 8 * 48 + 12),  // 8 Ctns + 12 Pcs
                ShopStockEntity(shopId = 1, productId = 7, totalPcs = 3 * 30 + 8),   // 3 Ctns + 8 Pcs (Low stock!)
                ShopStockEntity(shopId = 1, productId = 8, totalPcs = 18 * 60 + 25), // 18 Ctns + 25 Pcs

                // Shop 2 (Branch 2 Terribazar)
                ShopStockEntity(shopId = 2, productId = 1, totalPcs = 6 * 24),
                ShopStockEntity(shopId = 2, productId = 2, totalPcs = 10 * 50),
                ShopStockEntity(shopId = 2, productId = 3, totalPcs = 1 * 6), // Low stock
                ShopStockEntity(shopId = 2, productId = 4, totalPcs = 5 * 40),

                // Shop 3 (Central Godown Khatunganj)
                ShopStockEntity(shopId = 3, productId = 1, totalPcs = 50 * 24),
                ShopStockEntity(shopId = 3, productId = 2, totalPcs = 80 * 50),
                ShopStockEntity(shopId = 3, productId = 3, totalPcs = 25 * 6),
                ShopStockEntity(shopId = 3, productId = 4, totalPcs = 40 * 40),
                ShopStockEntity(shopId = 3, productId = 5, totalPcs = 35 * 12),
                ShopStockEntity(shopId = 3, productId = 6, totalPcs = 60 * 48),
                ShopStockEntity(shopId = 3, productId = 7, totalPcs = 30 * 30),
                ShopStockEntity(shopId = 3, productId = 8, totalPcs = 100 * 60)
            )
            stockDao.insertOrUpdateStocks(stocks)

            // 5. Initial Customers (Local & Outside) with Running Due
            val cust1 = CustomerEntity(
                id = 1,
                name = "Al-Madina Toy Store",
                phone = "01819-234567",
                address = "Anderkilla, Chittagong",
                customerType = "LOCAL",
                currentDue = 20000.0, // Matching the user prompt example!
                notes = "Regular wholesale buyer in Chittagong city"
            )
            val cust2 = CustomerEntity(
                id = 2,
                name = "Rahman Baby Corner",
                phone = "01711-987654",
                address = "Trunk Road, Feni",
                customerType = "OUTSIDE",
                currentDue = 45000.0,
                notes = "Outside Chittagong buyer, delivers via Feni parcel"
            )
            val cust3 = CustomerEntity(
                id = 3,
                name = "Chittagong Kids Kingdom",
                phone = "01912-345678",
                address = "GEC Circle, Chittagong",
                customerType = "LOCAL",
                currentDue = 15000.0,
                notes = "Local retail toy emporium"
            )
            val cust4 = CustomerEntity(
                id = 4,
                name = "Barisal Toy Palace",
                phone = "01611-456789",
                address = "Sadar Road, Barisal",
                customerType = "OUTSIDE",
                currentDue = 80000.0,
                notes = "Shipment via Sadarghat launch"
            )
            val cust5 = CustomerEntity(
                id = 5,
                name = "Haji Brothers Variety Store",
                phone = "01822-112233",
                address = "Main Road, Cox's Bazar",
                customerType = "OUTSIDE",
                currentDue = 0.0,
                notes = "Cash on delivery customer"
            )
            customerDao.insertCustomers(listOf(cust1, cust2, cust3, cust4, cust5))

            // 6. Initial Ledger Entries
            val now = System.currentTimeMillis()
            val dayAgo = now - 86400000L * 3
            customerDao.insertLedgerEntries(
                listOf(
                    CustomerLedgerEntity(
                        customerId = 1,
                        date = dayAgo,
                        type = "OPENING_DUE",
                        reference = "Previous Balance",
                        debit = 20000.0,
                        credit = 0.0,
                        balance = 20000.0,
                        notes = "Balance carried forward"
                    ),
                    CustomerLedgerEntity(
                        customerId = 2,
                        date = dayAgo,
                        type = "OPENING_DUE",
                        reference = "Previous Balance",
                        debit = 45000.0,
                        credit = 0.0,
                        balance = 45000.0,
                        notes = "Invoice #TG-2026-0012 balance"
                    ),
                    CustomerLedgerEntity(
                        customerId = 3,
                        date = dayAgo,
                        type = "OPENING_DUE",
                        reference = "Previous Balance",
                        debit = 15000.0,
                        credit = 0.0,
                        balance = 15000.0,
                        notes = "Opening balance"
                    ),
                    CustomerLedgerEntity(
                        customerId = 4,
                        date = dayAgo,
                        type = "OPENING_DUE",
                        reference = "Previous Balance",
                        debit = 80000.0,
                        credit = 0.0,
                        balance = 80000.0,
                        notes = "Due from previous shipments"
                    )
                )
            )
        }
    }
}
