package com.example.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.local.entity.CompanyEntity
import com.example.data.local.entity.ShopEntity
import com.example.ui.theme.PrimaryIndigo

@Composable
fun NewProductDialog(
    companies: List<CompanyEntity>,
    shops: List<ShopEntity>,
    activeShopId: Long?,
    onDismiss: () -> Unit,
    onConfirm: (
        sku: String,
        nameEn: String,
        nameBn: String,
        companyId: Long,
        companyName: String,
        category: String,
        pcsPerCarton: Int,
        purchasePriceCarton: Double,
        purchasePricePc: Double,
        sellingPriceCarton: Double,
        sellingPricePc: Double,
        lowStockCartons: Int,
        description: String,
        initialCartons: Int,
        initialLoosePcs: Int,
        targetShopId: Long
    ) -> Unit
) {
    var sku by remember { mutableStateOf("TG-${(1000..9999).random()}") }
    var nameEn by remember { mutableStateOf("") }
    var nameBn by remember { mutableStateOf("") }
    var selectedCompany by remember { mutableStateOf(companies.firstOrNull()) }
    var companyDropdownExpanded by remember { mutableStateOf(false) }
    var category by remember { mutableStateOf("General Toys") }
    var pcsPerCartonInput by remember { mutableStateOf("50") } // e.g. 1 Carton = 50 Pcs
    var purchasePriceCartonInput by remember { mutableStateOf("") }
    var purchasePricePcInput by remember { mutableStateOf("") }
    var sellingPriceCartonInput by remember { mutableStateOf("") }
    var sellingPricePcInput by remember { mutableStateOf("") }
    var lowStockThresholdInput by remember { mutableStateOf("5") }
    var initialCartonsInput by remember { mutableStateOf("10") }
    var initialLoosePcsInput by remember { mutableStateOf("0") }
    var selectedShopId by remember { mutableStateOf(activeShopId ?: shops.firstOrNull()?.id ?: 1L) }
    var errorText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text("Add New Product / নতুন খেলনা যোগ", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(
                    "Product Master with Company, Bilingual Names & Carton Units",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = nameEn,
                    onValueChange = { nameEn = it; errorText = "" },
                    label = { Text("Product Name (English) *") },
                    placeholder = { Text("e.g. Remote Control Super Racing Car") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("product_name_en_input")
                )

                OutlinedTextField(
                    value = nameBn,
                    onValueChange = { nameBn = it; errorText = "" },
                    label = { Text("Product Name (বাংলা ইউনিকোড) *") },
                    placeholder = { Text("যেমন: রিমোট কন্ট্রোল সুপার রেসিং কার") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("product_name_bn_input")
                )

                // Company Selector (Aman Plastic Toy, Jihan Toy Industries, etc.)
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = selectedCompany?.name ?: "Select Manufacturing Company",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Company / Brand *") },
                        trailingIcon = {
                            Icon(Icons.Default.KeyboardArrowDown, contentDescription = null)
                        },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Box(
                        modifier = Modifier
                            .matchParentSize()
                            .testTag("company_dropdown_click_box")
                    ) {
                        DropdownMenu(
                            expanded = companyDropdownExpanded,
                            onDismissRequest = { companyDropdownExpanded = false }
                        ) {
                            companies.forEach { comp ->
                                DropdownMenuItem(
                                    text = { Text(comp.name) },
                                    onClick = {
                                        selectedCompany = comp
                                        companyDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }
                OutlinedButton(
                    onClick = { companyDropdownExpanded = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Select Company (${selectedCompany?.name ?: "Choose"})")
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = sku,
                        onValueChange = { sku = it },
                        label = { Text("SKU / Barcode") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = category,
                        onValueChange = { category = it },
                        label = { Text("Category") },
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                // Carton & Pcs Conversion: 1 Carton = X Pcs
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                ) {
                    OutlinedTextField(
                        value = pcsPerCartonInput,
                        onValueChange = { pcsPerCartonInput = it },
                        label = { Text("Carton Packing (1 Carton = ? Pcs) *") },
                        placeholder = { Text("50") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("pcs_per_carton_input")
                    )
                }

                // Prices
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = purchasePriceCartonInput,
                        onValueChange = { purchasePriceCartonInput = it },
                        label = { Text("Buy Rate/Ctn") },
                        placeholder = { Text("9000") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = sellingPriceCartonInput,
                        onValueChange = { sellingPriceCartonInput = it },
                        label = { Text("Sell Rate/Ctn *") },
                        placeholder = { Text("12000") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f).testTag("sell_rate_carton_input")
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = purchasePricePcInput,
                        onValueChange = { purchasePricePcInput = it },
                        label = { Text("Buy Rate/Pc") },
                        placeholder = { Text("180") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = sellingPricePcInput,
                        onValueChange = { sellingPricePcInput = it },
                        label = { Text("Sell Rate/Pc *") },
                        placeholder = { Text("250") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f).testTag("sell_rate_pc_input")
                    )
                }

                // Low Stock Threshold & Initial Stock
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = lowStockThresholdInput,
                        onValueChange = { lowStockThresholdInput = it },
                        label = { Text("Low Stock Alert (Ctns)") },
                        placeholder = { Text("5") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = initialCartonsInput,
                        onValueChange = { initialCartonsInput = it },
                        label = { Text("Initial Cartons") },
                        placeholder = { Text("10") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                if (errorText.isNotBlank()) {
                    Text(errorText, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (nameEn.isBlank() || nameBn.isBlank()) {
                        errorText = "Please enter both English and Bangla names"
                        return@Button
                    }
                    val comp = selectedCompany
                    if (comp == null) {
                        errorText = "Please select a company"
                        return@Button
                    }
                    val pcsPerCtn = pcsPerCartonInput.toIntOrNull() ?: 50
                    val buyCtn = purchasePriceCartonInput.toDoubleOrNull() ?: 0.0
                    val buyPc = purchasePricePcInput.toDoubleOrNull() ?: 0.0
                    val sellCtn = sellingPriceCartonInput.toDoubleOrNull() ?: 0.0
                    val sellPc = sellingPricePcInput.toDoubleOrNull() ?: 0.0
                    val lowCtn = lowStockThresholdInput.toIntOrNull() ?: 5
                    val initCtn = initialCartonsInput.toIntOrNull() ?: 0
                    val initPcs = initialLoosePcsInput.toIntOrNull() ?: 0

                    onConfirm(
                        sku,
                        nameEn,
                        nameBn,
                        comp.id,
                        comp.name,
                        category,
                        pcsPerCtn,
                        buyCtn,
                        buyPc,
                        sellCtn,
                        sellPc,
                        lowCtn,
                        "",
                        initCtn,
                        initPcs,
                        selectedShopId
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                modifier = Modifier.testTag("save_product_btn")
            ) {
                Text("Add Product")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
