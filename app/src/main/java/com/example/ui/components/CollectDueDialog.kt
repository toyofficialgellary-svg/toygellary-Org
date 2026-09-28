package com.example.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
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
import com.example.data.local.entity.CustomerEntity
import com.example.data.util.BangladeshBanks
import com.example.ui.theme.DueCrimson
import com.example.ui.theme.PaidEmerald
import com.example.ui.theme.PrimaryIndigo

@Composable
fun CollectDueDialog(
    customer: CustomerEntity,
    onDismiss: () -> Unit,
    onConfirm: (amount: Double, method: String, bankName: String, transactionId: String, notes: String) -> Unit
) {
    var amountInput by remember { mutableStateOf("") }
    var selectedMethod by remember { mutableStateOf("Cash") }
    var selectedBank by remember { mutableStateOf(BangladeshBanks.ALL_BANKS.first()) }
    var bankDropdownExpanded by remember { mutableStateOf(false) }
    var transactionId by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    var errorText by remember { mutableStateOf("") }

    val amountDouble = amountInput.toDoubleOrNull() ?: 0.0
    val newDue = (customer.currentDue - amountDouble).coerceAtLeast(0.0)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(
                    text = "Collect Customer Due / বকেয়া আদায়",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Text(
                    text = "${customer.name} • Current Due: ৳${customer.currentDue.toInt()}",
                    fontSize = 13.sp,
                    color = DueCrimson,
                    fontWeight = FontWeight.SemiBold
                )
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = amountInput,
                    onValueChange = { amountInput = it; errorText = "" },
                    label = { Text("Payment Received (TK) *") },
                    placeholder = { Text("e.g. 10000") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("collect_amount_input")
                )

                // Quick Full Pay button
                Button(
                    onClick = { amountInput = customer.currentDue.toInt().toString() },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        "Quick Pay Full Due (৳${customer.currentDue.toInt()})",
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        fontSize = 12.sp
                    )
                }

                Text(
                    text = "Payment Method:",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )

                // Methods Chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf("Cash", "bKash", "Nagad", "Bank", "Rocket", "Upay").forEach { m ->
                        FilterChip(
                            selected = selectedMethod == m,
                            onClick = { selectedMethod = m },
                            label = { Text(m, fontSize = 11.sp) }
                        )
                    }
                }

                // If Bank selected, show all Bangladeshi banks
                if (selectedMethod == "Bank") {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = selectedBank,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Select Bangladeshi Bank") },
                            trailingIcon = {
                                Icon(Icons.Default.KeyboardArrowDown, contentDescription = null)
                            },
                            modifier = Modifier.fillMaxWidth()
                        )
                        DropdownMenu(
                            expanded = bankDropdownExpanded,
                            onDismissRequest = { bankDropdownExpanded = false }
                        ) {
                            BangladeshBanks.ALL_BANKS.forEach { bank ->
                                DropdownMenuItem(
                                    text = { Text(bank) },
                                    onClick = {
                                        selectedBank = bank
                                        bankDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                if (selectedMethod != "Cash") {
                    OutlinedTextField(
                        value = transactionId,
                        onValueChange = { transactionId = it },
                        label = { Text("Transaction ID / Cheque / Ref") },
                        placeholder = { Text("e.g. TrxID / Cheque #") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Remarks / নোট") },
                    placeholder = { Text("e.g. Cleared via Chittagong branch") },
                    modifier = Modifier.fillMaxWidth()
                )

                // Due calculation preview
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp)
                ) {
                    Text(
                        text = "Remaining Due after payment: ৳${newDue.toInt()}",
                        fontWeight = FontWeight.Bold,
                        color = if (newDue == 0.0) PaidEmerald else DueCrimson,
                        fontSize = 14.sp
                    )
                }

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
                    if (amountDouble <= 0) {
                        errorText = "Please enter valid payment amount"
                        return@Button
                    }
                    onConfirm(
                        amountDouble,
                        selectedMethod,
                        if (selectedMethod == "Bank") selectedBank else "",
                        transactionId,
                        notes
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = PaidEmerald),
                modifier = Modifier.testTag("confirm_collection_btn")
            ) {
                Text("Confirm Collection (৳${amountDouble.toInt()})")
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
