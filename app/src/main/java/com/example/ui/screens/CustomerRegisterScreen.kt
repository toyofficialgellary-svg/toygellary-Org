package com.example.ui.screens

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
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Search
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
import androidx.compose.material3.Surface
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.local.entity.CustomerEntity
import com.example.data.local.entity.CustomerLedgerEntity
import com.example.ui.ToyGalleryViewModel
import com.example.ui.components.CollectDueDialog
import com.example.ui.components.NewCustomerDialog
import com.example.ui.theme.AccentTeal
import com.example.ui.theme.DueCrimson
import com.example.ui.theme.PaidEmerald
import com.example.ui.theme.PrimaryIndigo
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun CustomerRegisterScreen(
    viewModel: ToyGalleryViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val customers by viewModel.customers.collectAsStateWithLifecycle()
    val viewingLedgerCustomer by viewModel.viewingLedgerCustomer.collectAsStateWithLifecycle()
    val customerLedger by viewModel.customerLedger.collectAsStateWithLifecycle()

    var searchQuery by remember { mutableStateOf("") }
    var selectedTypeFilter by remember { mutableStateOf<String?>(null) } // null, "LOCAL", "OUTSIDE", "DUE_ONLY"
    var showNewCustomerDialog by remember { mutableStateOf(false) }
    var collectingDueCustomer by remember { mutableStateOf<CustomerEntity?>(null) }

    val totalOutstandingDue = remember(customers) {
        customers.sumOf { it.currentDue }
    }

    val filteredCustomers = remember(customers, searchQuery, selectedTypeFilter) {
        val q = searchQuery.trim().lowercase()
        customers.filter { c ->
            val matchQuery = if (q.isBlank()) true else {
                c.name.lowercase().contains(q) ||
                        c.phone.contains(q) ||
                        c.address.lowercase().contains(q)
            }
            val matchType = when (selectedTypeFilter) {
                "LOCAL" -> c.customerType == "LOCAL"
                "OUTSIDE" -> c.customerType == "OUTSIDE"
                "DUE_ONLY" -> c.currentDue > 0
                else -> true
            }
            matchQuery && matchType
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(12.dp)
    ) {
        // Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Customer Register & Ledger",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryIndigo
                )
                Text(
                    text = "Local & Outside Customers • Total Due: ৳${totalOutstandingDue.toInt()} TK",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = DueCrimson
                )
            }

            Button(
                onClick = { showNewCustomerDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("add_customer_register_btn")
            ) {
                Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("New Customer", fontSize = 11.sp)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Search
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search customer name, phone, address...", fontSize = 12.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            trailingIcon = {
                if (searchQuery.isNotBlank()) {
                    IconButton(onClick = { searchQuery = "" }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear")
                    }
                }
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("customer_search_input")
        )

        // Filter Chips (All, Local, Outside, Due Only)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            FilterChip(
                selected = selectedTypeFilter == null,
                onClick = { selectedTypeFilter = null },
                label = { Text("All (${customers.size})", fontSize = 11.sp) }
            )
            FilterChip(
                selected = selectedTypeFilter == "DUE_ONLY",
                onClick = { selectedTypeFilter = "DUE_ONLY" },
                label = {
                    Text(
                        "With Due Only (${customers.count { it.currentDue > 0 }})",
                        fontSize = 11.sp,
                        color = DueCrimson,
                        fontWeight = FontWeight.Bold
                    )
                },
                modifier = Modifier.testTag("filter_due_only_chip")
            )
            FilterChip(
                selected = selectedTypeFilter == "LOCAL",
                onClick = { selectedTypeFilter = "LOCAL" },
                label = { Text("Local (Chittagong)", fontSize = 11.sp) }
            )
            FilterChip(
                selected = selectedTypeFilter == "OUTSIDE",
                onClick = { selectedTypeFilter = "OUTSIDE" },
                label = { Text("Outside (অন্যান্য জেলা)", fontSize = 11.sp) }
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Customer Cards
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(filteredCustomers, key = { it.id }) { customer ->
                CustomerItemCard(
                    customer = customer,
                    onViewLedger = { viewModel.openCustomerLedger(customer) },
                    onCollectDue = { collectingDueCustomer = customer }
                )
            }
        }
    }

    if (showNewCustomerDialog) {
        NewCustomerDialog(
            onDismiss = { showNewCustomerDialog = false },
            onConfirm = { name, phone, address, type, due, notes ->
                viewModel.addNewCustomer(name, phone, address, type, due, notes, autoSelectInPos = false)
                showNewCustomerDialog = false
            }
        )
    }

    if (collectingDueCustomer != null) {
        val cust = collectingDueCustomer!!
        CollectDueDialog(
            customer = cust,
            onDismiss = { collectingDueCustomer = null },
            onConfirm = { amount, method, bank, trx, notes ->
                viewModel.collectCustomerDue(cust, amount, method, bank, trx, notes)
                collectingDueCustomer = null
            }
        )
    }

    // Customer Ledger History Dialog (Audit Trail)
    if (viewingLedgerCustomer != null) {
        val customer = viewingLedgerCustomer!!
        CustomerLedgerDialog(
            customer = customer,
            ledger = customerLedger,
            onDismiss = { viewModel.closeCustomerLedger() },
            onExportCsv = {
                scope.launch {
                    val csv = viewModel.exportCustomerLedgerCsv(customer)
                    val sendIntent = Intent().apply {
                        action = Intent.ACTION_SEND
                        putExtra(Intent.EXTRA_TEXT, csv)
                        putExtra(Intent.EXTRA_TITLE, "Ledger_${customer.name}.csv")
                        type = "text/csv"
                    }
                    context.startActivity(Intent.createChooser(sendIntent, "Export Customer Ledger (Excel)"))
                    Toast.makeText(context, "Exported Ledger with UTF-8 BOM", Toast.LENGTH_SHORT).show()
                }
            },
            onCollectDue = {
                collectingDueCustomer = customer
            }
        )
    }
}

@Composable
fun CustomerItemCard(
    customer: CustomerEntity,
    onViewLedger: () -> Unit,
    onCollectDue: () -> Unit
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (customer.customerType == "LOCAL") AccentTeal.copy(alpha = 0.15f) else Color(0xFFFEF3C7)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            tint = if (customer.customerType == "LOCAL") AccentTeal else Color(0xFFD97706),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(customer.name, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = PrimaryIndigo)
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (customer.customerType == "LOCAL") Color(0xFFE0F2FE) else Color(0xFFFEF3C7))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = customer.customerType,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (customer.customerType == "LOCAL") Color(0xFF0369A1) else Color(0xFFB45309)
                                )
                            }
                        }

                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 2.dp)) {
                            Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(11.dp), tint = Color.Gray)
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(customer.phone, fontSize = 11.sp, color = Color.Gray)
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(11.dp), tint = Color.Gray)
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(customer.address, fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                }

                // Current Due Display
                Column(horizontalAlignment = Alignment.End) {
                    Text("Running Net Due:", fontSize = 9.sp, color = Color.Gray)
                    Text(
                        text = "৳${customer.currentDue.toInt()} TK",
                        fontWeight = FontWeight.Black,
                        fontSize = 14.sp,
                        color = if (customer.currentDue > 0) DueCrimson else PaidEmerald
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Action Buttons: Ledger & Collect Due
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedButton(
                    onClick = onViewLedger,
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.height(34.dp).testTag("view_ledger_btn_${customer.id}")
                ) {
                    Icon(Icons.Default.ReceiptLong, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Ledger History", fontSize = 11.sp)
                }

                if (customer.currentDue > 0) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = onCollectDue,
                        colors = ButtonDefaults.buttonColors(containerColor = PaidEmerald),
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.height(34.dp).testTag("collect_due_btn_${customer.id}")
                    ) {
                        Icon(Icons.Default.Payments, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Collect Due", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

/**
 * Customer Ledger Audit Trail Dialog
 */
@Composable
fun CustomerLedgerDialog(
    customer: CustomerEntity,
    ledger: List<CustomerLedgerEntity>,
    onDismiss: () -> Unit,
    onExportCsv: () -> Unit,
    onCollectDue: () -> Unit
) {
    val sdf = SimpleDateFormat("dd/MM/yy hh:mm a", Locale.getDefault())

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .padding(vertical = 16.dp),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Customer Ledger / খতিয়ান",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "${customer.name} (${customer.customerType}) • Phone: ${customer.phone}",
                            fontSize = 12.sp,
                            color = Color.DarkGray
                        )
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                // Balance summary card
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(if (customer.currentDue > 0) Color(0xFFFEF2F2) else Color(0xFFF0FDF4), RoundedCornerShape(6.dp))
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Current Outstanding Due:", fontSize = 11.sp, color = Color.DarkGray)
                        Text(
                            "৳${customer.currentDue.toInt()} TK",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Black,
                            color = if (customer.currentDue > 0) DueCrimson else PaidEmerald
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        OutlinedButton(
                            onClick = onExportCsv,
                            modifier = Modifier.height(36.dp).testTag("export_ledger_excel_btn")
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Excel (BOM)", fontSize = 11.sp)
                        }

                        if (customer.currentDue > 0) {
                            Button(
                                onClick = onCollectDue,
                                colors = ButtonDefaults.buttonColors(containerColor = PaidEmerald),
                                modifier = Modifier.height(36.dp)
                            ) {
                                Text("Collect Due", fontSize = 11.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Table Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFE2E8F0))
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Text("Date", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1.2f))
                    Text("Ref / Description", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1.5f))
                    Text("Debit (Bill)", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
                    Text("Credit (Paid)", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
                    Text("Balance (Due)", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1.2f), textAlign = TextAlign.End)
                }

                // Ledger entries list
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    items(ledger, key = { it.id }) { entry ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(sdf.format(Date(entry.date)), fontSize = 10.sp, color = Color.DarkGray, modifier = Modifier.weight(1.2f))
                            Column(modifier = Modifier.weight(1.5f)) {
                                Text(entry.reference, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                                if (entry.notes.isNotBlank()) {
                                    Text(entry.notes, fontSize = 9.sp, color = Color.Gray)
                                }
                            }
                            Text(
                                if (entry.debit > 0) "৳${entry.debit.toInt()}" else "-",
                                fontSize = 11.sp,
                                color = if (entry.debit > 0) DueCrimson else Color.Gray,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.End
                            )
                            Text(
                                if (entry.credit > 0) "৳${entry.credit.toInt()}" else "-",
                                fontSize = 11.sp,
                                color = if (entry.credit > 0) PaidEmerald else Color.Gray,
                                fontWeight = if (entry.credit > 0) FontWeight.Bold else FontWeight.Normal,
                                modifier = Modifier.weight(1f),
                                textAlign = TextAlign.End
                            )
                            Text(
                                "৳${entry.balance.toInt()}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (entry.balance > 0) DueCrimson else PaidEmerald,
                                modifier = Modifier.weight(1.2f),
                                textAlign = TextAlign.End
                            )
                        }
                        HorizontalDivider(color = Color(0xFFF1F5F9))
                    }
                }
            }
        }
    }
}
