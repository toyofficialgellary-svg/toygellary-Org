package com.example.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.PrimaryIndigo

@Composable
fun NewCompanyDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String, contactPerson: String, phone: String, address: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var contactPerson by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var errorText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text("Add Toy Company / কোম্পানি যোগ", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(
                    "Toy Manufacturer or Supplier",
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
                    label = { Text("Company Name *") },
                    placeholder = { Text("e.g. Aman Plastic Toy") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("company_name_input")
                )

                OutlinedTextField(
                    value = contactPerson,
                    onValueChange = { contactPerson = it },
                    label = { Text("Contact Person / Manager") },
                    placeholder = { Text("e.g. Md. Amanullah") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number") },
                    placeholder = { Text("017XXXXXXXX") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Factory / Office Address") },
                    placeholder = { Text("Kamrangirchar, Dhaka") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                if (errorText.isNotBlank()) {
                    Text(errorText, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isBlank()) {
                        errorText = "Please enter company name"
                        return@Button
                    }
                    onConfirm(name, contactPerson, phone, address)
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                modifier = Modifier.testTag("save_company_btn")
            ) {
                Text("Save Company")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
