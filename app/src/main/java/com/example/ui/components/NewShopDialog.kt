package com.example.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.PrimaryIndigo

@Composable
fun NewShopDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String, address: String, phone: String, isMain: Boolean) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var isMain by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text("Add New Shop / Outlet / নতুন ব্রাঞ্চ", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(
                    "Multi-Shop Management (Unlimited Outlets & Godowns)",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it; errorText = "" },
                    label = { Text("Shop / Godown Name *") },
                    placeholder = { Text("e.g. Toy Gallery - Muradpur Branch") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("shop_name_input")
                )

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Address / Location *") },
                    placeholder = { Text("e.g. CDA Avenue, Chittagong") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("shop_address_input")
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number") },
                    placeholder = { Text("018XXXXXXXX") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("shop_phone_input")
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Checkbox(checked = isMain, onCheckedChange = { isMain = it })
                    Text("Set as Main Showroom Outlet", fontSize = 13.sp)
                }

                if (errorText.isNotBlank()) {
                    Text(errorText, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isBlank() || address.isBlank()) {
                        errorText = "Please enter shop name and address"
                        return@Button
                    }
                    onConfirm(name, address, phone, isMain)
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                modifier = Modifier.testTag("save_shop_btn")
            ) {
                Text("Create Outlet")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
