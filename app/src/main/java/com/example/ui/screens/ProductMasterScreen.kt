package com.example.ui.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AddShoppingCart
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.local.entity.ProductEntity
import com.example.ui.LanguageMode
import com.example.ui.ToyGalleryViewModel
import com.example.ui.components.NewProductDialog
import com.example.ui.theme.AccentTeal
import com.example.ui.theme.DueCrimson
import com.example.ui.theme.PrimaryIndigo
import com.example.ui.theme.ToyAmber
import kotlinx.coroutines.launch

@Composable
fun ProductMasterScreen(
    viewModel: ToyGalleryViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val languageMode by viewModel.languageMode.collectAsStateWithLifecycle()
    val activeShop by viewModel.activeShop.collectAsStateWithLifecycle()
    val products by viewModel.products.collectAsStateWithLifecycle()
    val companies by viewModel.companies.collectAsStateWithLifecycle()
    val shops by viewModel.shops.collectAsStateWithLifecycle()
    val stockMap by viewModel.activeShopStockMap.collectAsStateWithLifecycle()
    val lowStockIds by viewModel.lowStockProductIds.collectAsStateWithLifecycle()

    var searchQuery by remember { mutableStateOf("") }
    var selectedCompanyFilter by remember { mutableStateOf<String?>(null) }
    var showOnlyLowStock by remember { mutableStateOf(false) }

    var showNewProductDialog by remember { mutableStateOf(false) }
    var selectedProductForStockAdd by remember { mutableStateOf<ProductEntity?>(null) }

    // Filter products
    val filteredProducts = remember(products, searchQuery, selectedCompanyFilter, showOnlyLowStock, lowStockIds) {
        val q = searchQuery.trim().lowercase()
        products.filter { p ->
            val matchQuery = if (q.isBlank()) true else {
                p.nameEn.lowercase().contains(q) ||
                        p.nameBn.contains(q) ||
                        p.sku.lowercase().contains(q) ||
                        p.companyName.lowercase().contains(q)
            }
            val matchComp = selectedCompanyFilter == null || p.companyName.equals(selectedCompanyFilter, ignoreCase = true)
            val matchLow = !showOnlyLowStock || lowStockIds.contains(p.id)
            matchQuery && matchComp && matchLow
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(12.dp)
    ) {
        // Top Action Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Product Master / পণ্যের তালিকা",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryIndigo
                )
                Text(
                    text = "Shop: ${activeShop?.name ?: "All Outlets"} • Total ${products.size} Products",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                // Export to Excel with UTF-8 BOM
                OutlinedButton(
                    onClick = {
                        scope.launch {
                            val csv = viewModel.exportProductsCsv()
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, csv)
                                putExtra(Intent.EXTRA_TITLE, "Toy_Gallery_Products.csv")
                                type = "text/csv"
                            }
                            context.startActivity(Intent.createChooser(sendIntent, "Export Products to Excel"))
                            Toast.makeText(context, "Exporting CSV with UTF-8 BOM for Excel", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.height(40.dp).testTag("export_excel_btn")
                ) {
                    Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Excel", fontSize = 11.sp)
                }

                // Add Product Button
                Button(
                    onClick = { showNewProductDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                    modifier = Modifier.height(40.dp).testTag("add_product_screen_btn")
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("New Product", fontSize = 11.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Search Bar (Bilingual Search)
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search toys in English or বাংলা (যেমন: কার, গান)...", fontSize = 12.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            trailingIcon = {
                if (searchQuery.isNotBlank()) {
                    IconButton(onClick = { searchQuery = "" }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear")
                    }
                }
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("product_master_search_input")
        )

        // Filters: Company Filter & Low Stock Toggle
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Low Stock Alert Filter Chip
            FilterChip(
                selected = showOnlyLowStock,
                onClick = { showOnlyLowStock = !showOnlyLowStock },
                label = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.NotificationsActive, contentDescription = null, modifier = Modifier.size(14.dp), tint = DueCrimson)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Low Stock Alert (${lowStockIds.size})", fontSize = 11.sp, color = DueCrimson, fontWeight = FontWeight.Bold)
                    }
                },
                modifier = Modifier.testTag("filter_low_stock_chip")
            )

            FilterChip(
                selected = selectedCompanyFilter == null,
                onClick = { selectedCompanyFilter = null },
                label = { Text("All Companies", fontSize = 11.sp) }
            )

            companies.forEach { comp ->
                FilterChip(
                    selected = selectedCompanyFilter == comp.name,
                    onClick = { selectedCompanyFilter = comp.name },
                    label = { Text(comp.name, fontSize = 11.sp) }
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Products List
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(filteredProducts, key = { it.id }) { product ->
                val totalStockPcs = stockMap[product.id] ?: 0
                val stockCartons = if (product.pcsPerCarton > 0) totalStockPcs / product.pcsPerCarton else 0
                val stockLoosePcs = if (product.pcsPerCarton > 0) totalStockPcs % product.pcsPerCarton else 0
                val isLow = lowStockIds.contains(product.id)

                ProductMasterCard(
                    product = product,
                    stockCartons = stockCartons,
                    stockLoosePcs = stockLoosePcs,
                    isLowStock = isLow,
                    languageMode = languageMode,
                    onAddStock = { selectedProductForStockAdd = product },
                    onAddToCart = { viewModel.addProductToCart(product, 1, 0) }
                )
            }
        }
    }

    if (showNewProductDialog) {
        NewProductDialog(
            companies = companies,
            shops = shops,
            activeShopId = activeShop?.id,
            onDismiss = { showNewProductDialog = false },
            onConfirm = { sku, nameEn, nameBn, compId, compName, cat, pcsCtn, buyCtn, buyPc, sellCtn, sellPc, lowCtn, desc, initCtn, initPcs, shopId ->
                viewModel.addNewProduct(
                    sku, nameEn, nameBn, compId, compName, cat, pcsCtn, buyCtn, buyPc, sellCtn, sellPc, lowCtn, desc, initCtn, initPcs, shopId
                )
                showNewProductDialog = false
            }
        )
    }

    if (selectedProductForStockAdd != null) {
        val prod = selectedProductForStockAdd!!
        AddStockDialog(
            product = prod,
            shopName = activeShop?.name ?: "Current Outlet",
            onDismiss = { selectedProductForStockAdd = null },
            onConfirm = { ctns, pcs ->
                viewModel.addStockToProduct(
                    shopId = activeShop?.id ?: 1L,
                    productId = prod.id,
                    cartonsToAdd = ctns,
                    pcsToAdd = pcs,
                    pcsPerCarton = prod.pcsPerCarton
                )
                selectedProductForStockAdd = null
            }
        )
    }
}

@Composable
fun ProductMasterCard(
    product: ProductEntity,
    stockCartons: Int,
    stockLoosePcs: Int,
    isLowStock: Boolean,
    languageMode: LanguageMode,
    onAddStock: () -> Unit,
    onAddToCart: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    when (languageMode) {
                        LanguageMode.ENGLISH -> {
                            Text(product.nameEn, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        LanguageMode.BANGLA -> {
                            Text(product.nameBn, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        LanguageMode.BOTH -> {
                            Text(product.nameEn, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(product.nameBn, fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                        }
                    }

                    Text(
                        text = "Company: ${product.companyName} • SKU: ${product.sku} • ${product.category}",
                        fontSize = 11.sp,
                        color = Color.DarkGray
                    )
                }

                if (isLowStock) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFFFEF2F2))
                            .border(1.dp, DueCrimson, RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = "Low Stock (≤ ${product.lowStockThresholdCartons} Ctn)",
                            fontSize = 10.sp,
                            color = DueCrimson,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Carton & Unit Specs Box
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF8FAFC), RoundedCornerShape(6.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Unit Packing:", fontSize = 10.sp, color = Color.Gray)
                    Text("1 Carton = ${product.pcsPerCarton} Pcs", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = ToyAmber)
                }

                Column {
                    Text("Selling Rates:", fontSize = 10.sp, color = Color.Gray)
                    Text("৳${product.sellingPriceCarton.toInt()}/ctn • ৳${product.sellingPricePc.toInt()}/pc", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("Current Stock:", fontSize = 10.sp, color = Color.Gray)
                    Text(
                        text = "$stockCartons Ctn + $stockLoosePcs Pcs",
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = if (isLowStock) DueCrimson else PaidEmerald
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Action Buttons: + Add Stock & + Add to POS Cart
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedButton(
                    onClick = onAddStock,
                    modifier = Modifier.height(34.dp)
                ) {
                    Icon(Icons.Default.Inventory2, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("+ Stock", fontSize = 11.sp)
                }

                Spacer(modifier = Modifier.width(8.dp))

                Button(
                    onClick = onAddToCart,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                    modifier = Modifier.height(34.dp)
                ) {
                    Icon(Icons.Default.AddShoppingCart, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add to POS", fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
fun AddStockDialog(
    product: ProductEntity,
    shopName: String,
    onDismiss: () -> Unit,
    onConfirm: (cartons: Int, pcs: Int) -> Unit
) {
    var cartonsInput by remember { mutableStateOf("5") }
    var loosePcsInput by remember { mutableStateOf("0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text("Add Incoming Stock / মাল রিসিভ", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("${product.nameEn} • $shopName", fontSize = 12.sp, color = Color.Gray)
                Text("1 Carton = ${product.pcsPerCarton} Pcs", fontSize = 11.sp, color = ToyAmber, fontWeight = FontWeight.Bold)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = cartonsInput,
                    onValueChange = { cartonsInput = it },
                    label = { Text("Add Cartons (কার্টুন)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = loosePcsInput,
                    onValueChange = { loosePcsInput = it },
                    label = { Text("Add Loose Pcs (খুচরা পিস)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val c = cartonsInput.toIntOrNull() ?: 0
                    val p = loosePcsInput.toIntOrNull() ?: 0
                    onConfirm(c, p)
                },
                colors = ButtonDefaults.buttonColors(containerColor = PaidEmerald)
            ) {
                Text("Add Stock")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
