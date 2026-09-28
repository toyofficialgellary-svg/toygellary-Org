package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.Badge
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.entity.ShopEntity
import com.example.ui.LanguageMode
import com.example.ui.theme.AccentTeal
import com.example.ui.theme.DueCrimson
import com.example.ui.theme.PrimaryIndigo
import com.example.ui.theme.ToyAmber

@Composable
fun PosHeader(
    activeShop: ShopEntity?,
    allShops: List<ShopEntity>,
    onSelectShop: (Long) -> Unit,
    languageMode: LanguageMode,
    onSelectLanguage: (LanguageMode) -> Unit,
    lowStockCount: Int,
    onLowStockClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    var shopMenuExpanded by remember { mutableStateOf(false) }
    var langMenuExpanded by remember { mutableStateOf(false) }

    Surface(
        color = PrimaryIndigo,
        contentColor = Color.White,
        modifier = modifier.fillMaxWidth(),
        shadowElevation = 4.dp
    ) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Branding
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(ToyAmber),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "TG",
                            fontWeight = FontWeight.Black,
                            fontSize = 18.sp,
                            color = Color.Black
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "TOY GALLERY",
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 17.sp,
                                letterSpacing = 0.5.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "টয় গ্যালারী",
                                fontSize = 13.sp,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                        }
                        Text(
                            text = "Chittagong • Farhad Hossain",
                            fontSize = 11.sp,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                    }
                }

                // Action Controls: Active Shop Selector, Low Stock Badge, Language Toggle
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Low Stock Alert Badge
                    if (lowStockCount > 0) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .background(DueCrimson.copy(alpha = 0.9f))
                                .clickable { onLowStockClick() }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                                .testTag("low_stock_banner_btn")
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.NotificationsActive,
                                    contentDescription = "Low Stock Alert",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "$lowStockCount Low Stock",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                        }
                    }

                    // Shop Selector
                    Box {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.White.copy(alpha = 0.15f))
                                .clickable { shopMenuExpanded = true }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                                .testTag("shop_selector_btn"),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Store,
                                contentDescription = null,
                                tint = AccentTeal,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = activeShop?.name ?: "Select Shop",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1
                            )
                            Icon(
                                Icons.Default.KeyboardArrowDown,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        DropdownMenu(
                            expanded = shopMenuExpanded,
                            onDismissRequest = { shopMenuExpanded = false }
                        ) {
                            Text(
                                text = "Select Active Outlet/Godown",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                            )
                            allShops.forEach { shop ->
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(
                                                    shop.name,
                                                    fontWeight = if (shop.id == activeShop?.id) FontWeight.Bold else FontWeight.Normal
                                                )
                                                if (shop.isMain) {
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        "(Main)",
                                                        fontSize = 11.sp,
                                                        color = AccentTeal,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                }
                                            }
                                            Text(
                                                shop.address,
                                                fontSize = 11.sp,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    },
                                    onClick = {
                                        onSelectShop(shop.id)
                                        shopMenuExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Language Selector
                    Box {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color.White.copy(alpha = 0.15f))
                                .clickable { langMenuExpanded = true }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                                .testTag("language_selector_btn"),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Translate,
                                contentDescription = null,
                                tint = ToyAmber,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = when (languageMode) {
                                    LanguageMode.ENGLISH -> "EN"
                                    LanguageMode.BANGLA -> "বাংলা"
                                    LanguageMode.BOTH -> "EN+বাং"
                                },
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Icon(
                                Icons.Default.KeyboardArrowDown,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp)
                            )
                        }

                        DropdownMenu(
                            expanded = langMenuExpanded,
                            onDismissRequest = { langMenuExpanded = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("English Only (EN)") },
                                onClick = {
                                    onSelectLanguage(LanguageMode.ENGLISH)
                                    langMenuExpanded = false
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("বাংলা শুধুমাত্র (Bangla)") },
                                onClick = {
                                    onSelectLanguage(LanguageMode.BANGLA)
                                    langMenuExpanded = false
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Both Bilingual (English + বাংলা)") },
                                onClick = {
                                    onSelectLanguage(LanguageMode.BOTH)
                                    langMenuExpanded = false
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
