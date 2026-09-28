package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Store
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import com.example.data.local.entity.ShopEntity
import com.example.ui.ToyGalleryViewModel
import com.example.ui.components.NewShopDialog
import com.example.ui.theme.AccentTeal
import com.example.ui.theme.PaidEmerald
import com.example.ui.theme.PrimaryIndigo

@Composable
fun MultiShopScreen(
    viewModel: ToyGalleryViewModel,
    modifier: Modifier = Modifier
) {
    val shops by viewModel.shops.collectAsStateWithLifecycle()
    val activeShop by viewModel.activeShop.collectAsStateWithLifecycle()
    val allStocks by viewModel.allStocks.collectAsStateWithLifecycle()

    var showNewShopDialog by remember { mutableStateOf(false) }

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
                    text = "Multi-Shop Management / মাল্টি-শপ ব্রাঞ্চ",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryIndigo
                )
                Text(
                    text = "Add unlimited shops, outlets & godowns in Chittagong",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Button(
                onClick = { showNewShopDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("add_shop_screen_btn")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("New Branch", fontSize = 11.sp)
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Shops List
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(shops, key = { it.id }) { shop ->
                val isActive = shop.id == activeShop?.id
                val shopStocks = allStocks.filter { it.shopId == shop.id }
                val totalPcs = shopStocks.sumOf { it.totalPcs }

                ShopCard(
                    shop = shop,
                    isActive = isActive,
                    totalPcsInStock = totalPcs,
                    onMakeActive = { viewModel.setActiveShop(shop.id) }
                )
            }
        }
    }

    if (showNewShopDialog) {
        NewShopDialog(
            onDismiss = { showNewShopDialog = false },
            onConfirm = { name, address, phone, isMain ->
                viewModel.addNewShop(name, address, phone, isMain)
                showNewShopDialog = false
            }
        )
    }
}

@Composable
fun ShopCard(
    shop: ShopEntity,
    isActive: Boolean,
    totalPcsInStock: Int,
    onMakeActive: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (isActive) Modifier.border(2.dp, AccentTeal, RoundedCornerShape(10.dp))
                else Modifier
            ),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isActive) AccentTeal.copy(alpha = 0.15f) else Color(0xFFF1F5F9)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Store,
                            contentDescription = null,
                            tint = if (isActive) AccentTeal else PrimaryIndigo,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(shop.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = PrimaryIndigo)
                            if (shop.isMain) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(AccentTeal)
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("Main Showroom", fontSize = 9.sp, color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(top = 2.dp)
                        ) {
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Gray)
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(shop.address, fontSize = 11.sp, color = Color.DarkGray)
                        }

                        if (shop.phone.isNotBlank()) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(top = 2.dp)
                            ) {
                                Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color.Gray)
                                Spacer(modifier = Modifier.width(2.dp))
                                Text(shop.phone, fontSize = 11.sp, color = Color.Gray)
                            }
                        }
                    }
                }

                if (isActive) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = PaidEmerald, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Active POS", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PaidEmerald)
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF8FAFC), RoundedCornerShape(6.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Total Inventoried Stock:", fontSize = 10.sp, color = Color.Gray)
                    Text("$totalPcsInStock Pieces", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = PrimaryIndigo)
                }

                if (!isActive) {
                    Button(
                        onClick = onMakeActive,
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Text("Switch to this Shop", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
