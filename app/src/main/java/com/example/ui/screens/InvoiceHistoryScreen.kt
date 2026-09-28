package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.local.entity.InvoiceEntity
import com.example.ui.ToyGalleryViewModel
import com.example.ui.theme.DueCrimson
import com.example.ui.theme.PaidEmerald
import com.example.ui.theme.PrimaryIndigo
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun InvoiceHistoryScreen(
    viewModel: ToyGalleryViewModel,
    modifier: Modifier = Modifier
) {
    val invoices by viewModel.invoices.collectAsStateWithLifecycle()
    var searchQuery by remember { mutableStateOf("") }
    val sdf = SimpleDateFormat("dd/MM/yyyy hh:mm a", Locale.getDefault())

    val filteredInvoices = remember(invoices, searchQuery) {
        val q = searchQuery.trim().lowercase()
        if (q.isBlank()) invoices
        else invoices.filter {
            it.invoiceNumber.lowercase().contains(q) ||
                    it.customerName.lowercase().contains(q) ||
                    it.customerPhone.contains(q) ||
                    it.shopName.lowercase().contains(q)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(12.dp)
    ) {
        // Header
        Column {
            Text(
                text = "Invoices & Sales / বিক্রয় রশিদ",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = PrimaryIndigo
            )
            Text(
                text = "Total ${invoices.size} Invoices • Click invoice to view or reprint in POS 80mm / A4",
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Search
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("Search invoice #, customer name or phone...", fontSize = 12.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            trailingIcon = {
                if (searchQuery.isNotBlank()) {
                    IconButton(onClick = { searchQuery = "" }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear")
                    }
                }
            },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().testTag("invoice_search_input")
        )

        Spacer(modifier = Modifier.height(10.dp))

        if (filteredInvoices.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No invoices found. Generate sales from POS Billing tab.",
                    fontSize = 13.sp,
                    color = Color.Gray
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredInvoices, key = { it.id }) { invoice ->
                    InvoiceHistoryCard(
                        invoice = invoice,
                        dateStr = sdf.format(Date(invoice.date)),
                        onViewInvoice = { viewModel.openInvoicePreview(invoice) }
                    )
                }
            }
        }
    }
}

@Composable
fun InvoiceHistoryCard(
    invoice: InvoiceEntity,
    dateStr: String,
    onViewInvoice: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onViewInvoice() },
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
                            .background(Color(0xFFF1F5F9)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Receipt, contentDescription = null, tint = PrimaryIndigo, modifier = Modifier.size(20.dp))
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(invoice.invoiceNumber, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = PrimaryIndigo)
                        Text(dateStr, fontSize = 10.sp, color = Color.Gray)
                    }
                }

                OutlinedButton(
                    onClick = onViewInvoice,
                    modifier = Modifier.height(32.dp).testTag("reprint_btn_${invoice.id}")
                ) {
                    Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Print / View", fontSize = 11.sp)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Details
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF8FAFC), RoundedCornerShape(6.dp))
                    .padding(8.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Customer:", fontSize = 9.sp, color = Color.Gray)
                    Text(invoice.customerName, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Text("Shop: ${invoice.shopName}", fontSize = 10.sp, color = Color.Gray)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("Bill: ৳${invoice.currentBill.toInt()} • Paid: ৳${invoice.paidNow.toInt()}", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    Text(
                        text = "Net Total Due: ৳${invoice.netTotalDue.toInt()} TK",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (invoice.netTotalDue > 0) DueCrimson else PaidEmerald
                    )
                }
            }
        }
    }
}
