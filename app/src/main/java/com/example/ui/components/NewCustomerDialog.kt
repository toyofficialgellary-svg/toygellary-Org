package com.example.ui.components

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FilterChip
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.AccentTeal
import com.example.ui.theme.PrimaryIndigo

@Composable
fun NewCustomerDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String, phone: String, address: String, type: String, openingDue: Double, notes: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var customerType by remember { mutableStateOf("LOCAL") } // LOCAL or OUTSIDE
    var openingDueInput by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var errorText by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(
                    text = "Add New Customer / কাস্টমার যোগ",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Text(
                    text = "Register customer with Local/Outside type & opening due",
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
                // Customer Type Selection
                Text(
                    text = "Customer Classification:",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = customerType == "LOCAL",
                        onClick = { customerType = "LOCAL" },
                        label = { Text("Local (Chittagong City)") },
                        modifier = Modifier.testTag("type_local_chip")
                    )
                    FilterChip(
                        selected = customerType == "OUTSIDE",
                        onClick = { customerType = "OUTSIDE" },
                        label = { Text("Outside (অন্যান্য জেলা)") },
                        modifier = Modifier.testTag("type_outside_chip")
                    )
                }

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it; errorText = "" },
                    label = { Text("Customer / Shop Name *") },
                    placeholder = { Text("e.g. Al-Madina Toy Store / মোঃ ফারুক") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("cust_name_input")
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Phone Number *") },
                    placeholder = { Text("018XXXXXXXX") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("cust_phone_input")
                )

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Address / Location") },
                    placeholder = { Text("e.g. Anderkilla, Chittagong or Trunk Road, Feni") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("cust_address_input")
                )

                OutlinedTextField(
                    value = openingDueInput,
                    onValueChange = { openingDueInput = it },
                    label = { Text("Previous / Opening Due (TK) - পূর্বের বকেয়া") },
                    placeholder = { Text("0 or 20000") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("cust_due_input")
                )

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes / রেফারেন্স") },
                    placeholder = { Text("Regular wholesaler / parcel delivery notes") },
                    modifier = Modifier.fillMaxWidth()
                )

                if (errorText.isNotBlank()) {
                    Text(
                        text = errorText,
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isBlank()) {
                        errorText = "Please enter customer or shop name"
                        return@Button
                    }
                    val due = openingDueInput.toDoubleOrNull() ?: 0.0
                    onConfirm(name, phone, address, customerType, due, notes)
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                modifier = Modifier.testTag("save_customer_btn")
            ) {
                Text("Save Customer")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
