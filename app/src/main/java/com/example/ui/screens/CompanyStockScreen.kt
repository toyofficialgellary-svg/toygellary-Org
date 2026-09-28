package com.example.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Inventory
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.local.entity.CompanyEntity
import com.example.data.local.entity.ProductEntity
import com.example.ui.LanguageMode
import com.example.ui.ToyGalleryViewModel
import com.example.ui.components.NewCompanyDialog
import com.example.ui.theme.AccentTeal
import com.example.ui.theme.PrimaryIndigo
import com.example.ui.theme.ToyAmber

@Composable
fun CompanyStockScreen(
    viewModel: ToyGalleryViewModel,
    modifier: Modifier = Modifier
) {
    val languageMode by viewModel.languageMode.collectAsStateWithLifecycle()
    val companies by viewModel.companies.collectAsStateWithLifecycle()
    val products by viewModel.products.collectAsStateWithLifecycle()
    val stockMap by viewModel.activeShopStockMap.collectAsStateWithLifecycle()
    val activeShop by viewModel.activeShop.collectAsStateWithLifecycle()

    var showNewCompanyDialog by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(12.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Company-wise Stock / কোম্পানি অনুযায়ী স্টক",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryIndigo
                )
                Text(
                    text = "Suppliers: Aman Plastic Toy, Jihan Toy Industries • Outlet: ${activeShop?.name ?: "All"}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Button(
                onClick = { showNewCompanyDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("add_company_screen_btn")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("New Company", fontSize = 11.sp)
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Companies List with Stock Stats
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(companies, key = { it.id }) { company ->
                val companyProducts = products.filter { it.companyId == company.id || it.companyName.equals(company.name, ignoreCase = true) }
                var totalStockPcs = 0
                var totalStockCartons = 0
                var totalStockValue = 0.0

                for (p in companyProducts) {
                    val pcs = stockMap[p.id] ?: 0
                    totalStockPcs += pcs
                    val ctns = if (p.pcsPerCarton > 0) pcs / p.pcsPerCarton else 0
                    totalStockCartons += ctns
                    totalStockValue += ctns * p.sellingPriceCarton + (if (p.pcsPerCarton > 0) (pcs % p.pcsPerCarton) * p.sellingPricePc else 0.0)
                }

                CompanyStockCard(
                    company = company,
                    products = companyProducts,
                    totalCartons = totalStockCartons,
                    totalPcs = totalStockPcs,
                    totalValue = totalStockValue,
                    languageMode = languageMode,
                    stockMap = stockMap
                )
            }
        }
    }

    if (showNewCompanyDialog) {
        NewCompanyDialog(
            onDismiss = { showNewCompanyDialog = false },
            onConfirm = { name, contact, phone, address ->
                viewModel.addNewCompany(name, contact, phone, address)
                showNewCompanyDialog = false
            }
        )
    }
}

@Composable
fun CompanyStockCard(
    company: CompanyEntity,
    products: List<ProductEntity>,
    totalCartons: Int,
    totalPcs: Int,
    totalValue: Double,
    languageMode: LanguageMode,
    stockMap: Map<Long, Int>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            // Company Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(AccentTeal.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Business, contentDescription = null, tint = AccentTeal, modifier = Modifier.size(20.dp))
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(company.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = PrimaryIndigo)
                        if (company.contactPerson.isNotBlank() || company.phone.isNotBlank()) {
                            Text(
                                text = "${company.contactPerson} • ${company.phone}",
                                fontSize = 11.sp,
                                color = Color.Gray
                            )
                        }
                    }
                }

                Text(
                    text = "${products.size} Products",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AccentTeal
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Stock Summary Stats
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF8FAFC), RoundedCornerShape(6.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Total Stock Cartons:", fontSize = 10.sp, color = Color.Gray)
                    Text("$totalCartons Ctns", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = ToyAmber)
                }
                Column {
                    Text("Total Pieces:", fontSize = 10.sp, color = Color.Gray)
                    Text("$totalPcs Pcs", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Retail Stock Value:", fontSize = 10.sp, color = Color.Gray)
                    Text("৳${totalValue.toInt()}", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = PrimaryIndigo)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Products list under this company
            Text("Products Catalog / কোম্পানি পণ্যসমূহ:", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color.DarkGray)
            Column(
                modifier = Modifier.padding(top = 4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                products.forEach { p ->
                    val pcs = stockMap[p.id] ?: 0
                    val ctns = if (p.pcsPerCarton > 0) pcs / p.pcsPerCarton else 0
                    val loose = if (p.pcsPerCarton > 0) pcs % p.pcsPerCarton else 0

                    val displayName = when (languageMode) {
                        LanguageMode.ENGLISH -> p.nameEn
                        LanguageMode.BANGLA -> p.nameBn
                        LanguageMode.BOTH -> "${p.nameEn} (${p.nameBn})"
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(displayName, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                            Text("1 Ctn = ${p.pcsPerCarton} Pcs • ৳${p.sellingPriceCarton.toInt()}/ctn", fontSize = 10.sp, color = Color.Gray)
                        }
                        Text(
                            "$ctns Ctn + $loose Pcs",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryIndigo
                        )
                    }
                    HorizontalDivider(color = Color(0xFFF1F5F9))
                }
            }
        }
    }
}
