package com.example.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.local.entity.InvoiceEntity
import com.example.data.local.entity.InvoiceItemEntity
import com.example.ui.InvoicePrintFormat
import com.example.ui.LanguageMode
import com.example.ui.theme.DueCrimson
import com.example.ui.theme.PaidEmerald
import com.example.ui.theme.PrimaryIndigo
import com.example.ui.theme.ToyAmber
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun InvoicePreviewDialog(
    invoice: InvoiceEntity,
    items: List<InvoiceItemEntity>,
    initialFormat: InvoicePrintFormat = InvoicePrintFormat.POS_80MM,
    initialLanguage: LanguageMode = LanguageMode.BOTH,
    onDismiss: () -> Unit
) {
    var format by remember { mutableStateOf(initialFormat) }
    var language by remember { mutableStateOf(initialLanguage) }
    val context = LocalContext.current

    val sdf = SimpleDateFormat("dd/MM/yyyy hh:mm a", Locale.getDefault())
    val formattedDate = sdf.format(Date(invoice.date))

    val invoiceText = remember(invoice, items, language, format) {
        buildPrintableInvoiceText(invoice, items, language, format, formattedDate)
    }

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
            tonalElevation = 8.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                // Header with Format & Language Controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Invoice / বিল ভাউচার",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = invoice.invoiceNumber,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                // Format & Language Switchers
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Format Chips (POS 80mm vs A4 Full)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(
                            selected = format == InvoicePrintFormat.POS_80MM,
                            onClick = { format = InvoicePrintFormat.POS_80MM },
                            label = { Text("POS 80mm", fontSize = 11.sp) },
                            modifier = Modifier.testTag("format_pos_btn")
                        )
                        FilterChip(
                            selected = format == InvoicePrintFormat.A4_FULL,
                            onClick = { format = InvoicePrintFormat.A4_FULL },
                            label = { Text("A4 Full", fontSize = 11.sp) },
                            modifier = Modifier.testTag("format_a4_btn")
                        )
                    }

                    // Language Chips (English / বাংলা / Both)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        FilterChip(
                            selected = language == LanguageMode.ENGLISH,
                            onClick = { language = LanguageMode.ENGLISH },
                            label = { Text("EN", fontSize = 11.sp) },
                            modifier = Modifier.testTag("lang_en_btn")
                        )
                        FilterChip(
                            selected = language == LanguageMode.BANGLA,
                            onClick = { language = LanguageMode.BANGLA },
                            label = { Text("বাংলা", fontSize = 11.sp) },
                            modifier = Modifier.testTag("lang_bn_btn")
                        )
                        FilterChip(
                            selected = language == LanguageMode.BOTH,
                            onClick = { language = LanguageMode.BOTH },
                            label = { Text("Both", fontSize = 11.sp) },
                            modifier = Modifier.testTag("lang_both_btn")
                        )
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

                // Invoice Body Preview (Scrollable)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFFCFDFE))
                        .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(8.dp))
                        .padding(12.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    if (format == InvoicePrintFormat.POS_80MM) {
                        Pos80mmReceiptLayout(invoice, items, language, formattedDate)
                    } else {
                        A4InvoiceLayout(invoice, items, language, formattedDate)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Bottom Action Buttons: Print / Share / Copy
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("Toy Gallery Invoice", invoiceText)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "Invoice copied to clipboard", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Copy", fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, invoiceText)
                                putExtra(Intent.EXTRA_TITLE, "Invoice - ${invoice.invoiceNumber}")
                                type = "text/plain"
                            }
                            context.startActivity(Intent.createChooser(sendIntent, "Share Invoice via WhatsApp / Printer"))
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Share", fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            val printIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, invoiceText)
                                type = "text/plain"
                            }
                            context.startActivity(Intent.createChooser(printIntent, "Print Invoice"))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryIndigo),
                        modifier = Modifier
                            .weight(1.2f)
                            .testTag("print_invoice_btn")
                    ) {
                        Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Print / POS", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

/**
 * Modern POS 80mm Thermal Receipt Layout
 */
@Composable
fun Pos80mmReceiptLayout(
    invoice: InvoiceEntity,
    items: List<InvoiceItemEntity>,
    language: LanguageMode,
    formattedDate: String
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Shop Branding Header
        Text(
            text = "★ TOY GALLERY ★",
            fontWeight = FontWeight.Black,
            fontSize = 17.sp,
            color = Color.Black,
            textAlign = TextAlign.Center
        )
        Text(
            text = "টয় গ্যালারী (খেলনার জগত)",
            fontSize = 12.sp,
            color = Color.DarkGray,
            textAlign = TextAlign.Center
        )
        Text(
            text = "Jalsa Market 2nd Floor, Riazuddin Bazar, Chittagong",
            fontSize = 11.sp,
            color = Color.DarkGray,
            textAlign = TextAlign.Center
        )
        Text(
            text = "Proprietor: Farhad Hossain | 01819-556677",
            fontSize = 10.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center
        )

        DashedDivider()

        // Invoice Meta
        Column(modifier = Modifier.fillMaxWidth()) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "Inv #: ${invoice.invoiceNumber}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                Text(text = formattedDate, fontSize = 10.sp, color = Color.DarkGray)
            }
            Text(text = "Shop: ${invoice.shopName}", fontSize = 10.sp, color = Color.DarkGray)
            Text(
                text = "Customer: ${invoice.customerName} (${invoice.customerType})",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.Black
            )
            if (invoice.customerPhone.isNotBlank()) {
                Text(text = "Phone: ${invoice.customerPhone}", fontSize = 10.sp, color = Color.DarkGray)
            }
        }

        DashedDivider()

        // Items Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Item Details", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(2f))
            Text(text = "Qty (Ctn/Pc)", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1.2f), textAlign = TextAlign.Center)
            Text(text = "Total (TK)", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
        }

        DashedDivider()

        // Item Rows
        items.forEach { item ->
            val productName = when (language) {
                LanguageMode.ENGLISH -> item.productNameEn
                LanguageMode.BANGLA -> item.productNameBn
                LanguageMode.BOTH -> "${item.productNameEn}\n${item.productNameBn}"
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 2.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(2f)) {
                    Text(text = productName, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = Color.Black)
                    Text(text = "[${item.companyName}] 1 Ctn=${item.pcsPerCarton} Pcs", fontSize = 9.sp, color = Color.Gray)
                }

                val qtyStr = buildString {
                    if (item.cartonsQuantity > 0) append("${item.cartonsQuantity} Ctn ")
                    if (item.pcsQuantity > 0) append("${item.pcsQuantity} Pcs")
                    if (item.cartonsQuantity == 0 && item.pcsQuantity == 0) append("${item.totalPcs} Pcs")
                }
                Text(
                    text = qtyStr,
                    fontSize = 10.sp,
                    color = Color.DarkGray,
                    modifier = Modifier.weight(1.2f),
                    textAlign = TextAlign.Center
                )

                Text(
                    text = "৳${item.totalAmount.toInt()}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.Black,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.End
                )
            }
        }

        DashedDivider()

        // RUNNING DUE BREAKDOWN (Critical Requirement!)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(3.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Subtotal:", fontSize = 11.sp, color = Color.DarkGray)
                Text("৳${(invoice.currentBill + invoice.discount).toInt()}", fontSize = 11.sp, color = Color.DarkGray)
            }

            if (invoice.discount > 0) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Discount:", fontSize = 11.sp, color = Color.DarkGray)
                    Text("-৳${invoice.discount.toInt()}", fontSize = 11.sp, color = Color.DarkGray)
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Current Bill (এই বিল):", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                Text("৳${invoice.currentBill.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black)
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                val payLabel = buildString {
                    append("Paid Now (${invoice.paymentMethod})")
                    if (invoice.bankName.isNotBlank()) append(" ${invoice.bankName}")
                    if (invoice.transactionId.isNotBlank()) append(" Trx: ${invoice.transactionId}")
                }
                Text(payLabel, fontSize = 11.sp, color = PaidEmerald, fontWeight = FontWeight.SemiBold)
                Text("৳${invoice.paidNow.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = PaidEmerald)
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Due of this Bill (বর্তমান বিল বকেয়া):", fontSize = 11.sp, color = Color.DarkGray)
                Text("৳${invoice.billDue.toInt()}", fontSize = 11.sp, color = Color.DarkGray)
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Previous Due (পূর্বের বকেয়া):", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = DueCrimson)
                Text("৳${invoice.previousDue.toInt()}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = DueCrimson)
            }

            DashedDivider()

            // NET TOTAL DUE HIGHLIGHT
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFFEF2F2))
                    .padding(horizontal = 6.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "NET TOTAL DUE (মোট বকেয়া):",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black,
                    color = DueCrimson
                )
                Text(
                    text = "৳${invoice.netTotalDue.toInt()}",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Black,
                    color = DueCrimson
                )
            }
        }

        DashedDivider()

        Text(
            text = "Thank You For Visiting Toy Gallery!",
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = Color.DarkGray,
            textAlign = TextAlign.Center
        )
        Text(
            text = "খেলনা কেনার বিশ্বস্ত প্রতিষ্ঠান • কোনো পণ্য ফেরতযোগ্য নয়",
            fontSize = 9.sp,
            color = Color.Gray,
            textAlign = TextAlign.Center
        )
    }
}

/**
 * Formal A4 Sheet Invoice Layout
 */
@Composable
fun A4InvoiceLayout(
    invoice: InvoiceEntity,
    items: List<InvoiceItemEntity>,
    language: LanguageMode,
    formattedDate: String
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        // A4 Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column {
                Text("TOY GALLERY", fontWeight = FontWeight.Black, fontSize = 20.sp, color = PrimaryIndigo)
                Text("টয় গ্যালারী - পাইকারী ও খুচরা খেলনা বিক্রয় কেন্দ্র", fontSize = 12.sp, color = Color.DarkGray)
                Text("Jalsa Market 2nd Floor, Riazuddin Bazar, Chittagong", fontSize = 11.sp, color = Color.DarkGray)
                Text("Owner: Farhad Hossain | Phone: 01819-556677", fontSize = 11.sp, color = Color.DarkGray)
                Text("Email: toyofficialgellary@gmail.com", fontSize = 10.sp, color = Color.Gray)
            }

            Column(horizontalAlignment = Alignment.End) {
                Box(
                    modifier = Modifier
                        .background(PrimaryIndigo, RoundedCornerShape(4.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("INVOICE / বিল", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text("No: ${invoice.invoiceNumber}", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.Black)
                Text("Date: $formattedDate", fontSize = 11.sp, color = Color.DarkGray)
                Text("Branch: ${invoice.shopName}", fontSize = 11.sp, color = Color.DarkGray)
            }
        }

        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), thickness = 2.dp, color = PrimaryIndigo)

        // Customer Details Box
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFF8FAFC), RoundedCornerShape(6.dp))
                .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(6.dp))
                .padding(10.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("Bill To / ক্রেতার বিবরণ:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.DarkGray)
                    Text(invoice.customerName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    Text("Type: ${invoice.customerType} | Phone: ${invoice.customerPhone}", fontSize = 11.sp, color = Color.DarkGray)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Previous Ledger Due:", fontSize = 11.sp, color = Color.DarkGray)
                    Text("৳${invoice.previousDue.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = DueCrimson)
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
            Text("#", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.width(20.dp))
            Text("Description (বিবরণ)", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(2f))
            Text("Packing", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
            Text("Quantity", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1.2f), textAlign = TextAlign.Center)
            Text("Rate", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), textAlign = TextAlign.End)
            Text("Amount (TK)", fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1.2f), textAlign = TextAlign.End)
        }

        // Table Items
        items.forEachIndexed { idx, item ->
            val pName = when (language) {
                LanguageMode.ENGLISH -> item.productNameEn
                LanguageMode.BANGLA -> item.productNameBn
                LanguageMode.BOTH -> "${item.productNameEn} / ${item.productNameBn}"
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("${idx + 1}", fontSize = 10.sp, color = Color.Gray, modifier = Modifier.width(20.dp))
                Column(modifier = Modifier.weight(2f)) {
                    Text(pName, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = Color.Black)
                    Text(item.companyName, fontSize = 9.sp, color = Color.Gray)
                }
                Text("1 Ctn=${item.pcsPerCarton} Pcs", fontSize = 10.sp, color = Color.DarkGray, modifier = Modifier.weight(1f))
                val qStr = buildString {
                    if (item.cartonsQuantity > 0) append("${item.cartonsQuantity} Ctn ")
                    if (item.pcsQuantity > 0) append("${item.pcsQuantity} Pcs")
                    if (item.cartonsQuantity == 0 && item.pcsQuantity == 0) append("${item.totalPcs} Pcs")
                }
                Text(qStr, fontSize = 10.sp, color = Color.Black, modifier = Modifier.weight(1.2f), textAlign = TextAlign.Center)
                Text(
                    if (item.cartonsQuantity > 0) "৳${item.ratePerCarton.toInt()}/ctn" else "৳${item.ratePerPc.toInt()}/pc",
                    fontSize = 10.sp,
                    color = Color.DarkGray,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.End
                )
                Text("৳${item.totalAmount.toInt()}", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color.Black, modifier = Modifier.weight(1.2f), textAlign = TextAlign.End)
            }
            HorizontalDivider(color = Color(0xFFF1F5F9))
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Running Due Summary Box (Right Aligned)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            Column(
                modifier = Modifier
                    .width(300.dp)
                    .background(Color(0xFFF8FAFC), RoundedCornerShape(6.dp))
                    .border(1.dp, Color(0xFFCBD5E1), RoundedCornerShape(6.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Current Bill / বর্তমান বিল:", fontSize = 11.sp, color = Color.DarkGray)
                    Text("৳${invoice.currentBill.toInt()}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Paid Now (${invoice.paymentMethod}):", fontSize = 11.sp, color = PaidEmerald, fontWeight = FontWeight.SemiBold)
                    Text("৳${invoice.paidNow.toInt()}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = PaidEmerald)
                }
                if (invoice.transactionId.isNotBlank()) {
                    Text("Trx ID: ${invoice.transactionId}", fontSize = 9.sp, color = Color.Gray)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Due of this Bill:", fontSize = 11.sp, color = Color.DarkGray)
                    Text("৳${invoice.billDue.toInt()}", fontSize = 11.sp, color = Color.DarkGray)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Previous Due (পূর্বের বকেয়া):", fontSize = 11.sp, color = DueCrimson, fontWeight = FontWeight.SemiBold)
                    Text("৳${invoice.previousDue.toInt()}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = DueCrimson)
                }
                HorizontalDivider(color = Color(0xFF94A3B8))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("NET TOTAL DUE (সর্বমোট বকেয়া):", fontSize = 12.sp, fontWeight = FontWeight.Black, color = DueCrimson)
                    Text("৳${invoice.netTotalDue.toInt()}", fontSize = 14.sp, fontWeight = FontWeight.Black, color = DueCrimson)
                }
            }
        }
    }
}

@Composable
fun DashedDivider() {
    Text(
        text = "------------------------------------------",
        fontSize = 11.sp,
        color = Color.LightGray,
        textAlign = TextAlign.Center,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    )
}

fun buildPrintableInvoiceText(
    invoice: InvoiceEntity,
    items: List<InvoiceItemEntity>,
    language: LanguageMode,
    format: InvoicePrintFormat,
    formattedDate: String
): String {
    return buildString {
        append("=========================================\n")
        append("             TOY GALLERY (টয় গ্যালারী)    \n")
        append("   Jalsa Market 2nd Floor, Riazuddin Bazar\n")
        append("             Chittagong, Bangladesh       \n")
        append("     Owner: Farhad Hossain | 01819-556677\n")
        append("=========================================\n")
        append("Invoice No : ${invoice.invoiceNumber}\n")
        append("Date & Time: $formattedDate\n")
        append("Branch     : ${invoice.shopName}\n")
        append("Customer   : ${invoice.customerName} (${invoice.customerType})\n")
        if (invoice.customerPhone.isNotBlank()) {
            append("Phone      : ${invoice.customerPhone}\n")
        }
        append("-----------------------------------------\n")
        append(String.format("%-18s %-12s %8s\n", "Item", "Qty", "Total TK"))
        append("-----------------------------------------\n")

        for (item in items) {
            val name = when (language) {
                LanguageMode.ENGLISH -> item.productNameEn
                LanguageMode.BANGLA -> item.productNameBn
                LanguageMode.BOTH -> "${item.productNameEn} / ${item.productNameBn}"
            }
            val qty = buildString {
                if (item.cartonsQuantity > 0) append("${item.cartonsQuantity}Ctn ")
                if (item.pcsQuantity > 0) append("${item.pcsQuantity}Pc")
                if (item.cartonsQuantity == 0 && item.pcsQuantity == 0) append("${item.totalPcs}Pc")
            }
            append("${name}\n")
            append(String.format("  [%s] 1Ctn=%dPc  %-10s %8.0f\n", item.companyName, item.pcsPerCarton, qty, item.totalAmount))
        }

        append("-----------------------------------------\n")
        append(String.format("Current Bill (এই বিল)     : ৳%.0f\n", invoice.currentBill))
        append(String.format("Paid Now (%s)%s : ৳%.0f\n",
            invoice.paymentMethod,
            if (invoice.transactionId.isNotBlank()) " Trx:${invoice.transactionId}" else "",
            invoice.paidNow
        ))
        append(String.format("Due of this Bill          : ৳%.0f\n", invoice.billDue))
        append(String.format("Previous Due (পূর্বের বকেয়া): ৳%.0f\n", invoice.previousDue))
        append("=========================================\n")
        append(String.format("NET TOTAL DUE (মোট বকেয়া) : ৳%.0f\n", invoice.netTotalDue))
        append("=========================================\n")
        append("Thank you for choosing Toy Gallery, Chittagong!\n")
    }
}
