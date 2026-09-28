package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Store
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.InvoicePrintFormat
import com.example.ui.LanguageMode
import com.example.ui.ScreenTab
import com.example.ui.ToyGalleryViewModel
import com.example.ui.components.InvoicePreviewDialog
import com.example.ui.components.PosHeader
import com.example.ui.screens.CompanyStockScreen
import com.example.ui.screens.CustomerRegisterScreen
import com.example.ui.screens.InvoiceHistoryScreen
import com.example.ui.screens.MultiShopScreen
import com.example.ui.screens.PosBillingScreen
import com.example.ui.screens.ProductMasterScreen
import com.example.ui.theme.AccentTeal
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.PrimaryIndigo
import com.example.ui.theme.ToyAmber

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                ToyGalleryApp()
            }
        }
    }
}

@Composable
fun ToyGalleryApp(
    viewModel: ToyGalleryViewModel = viewModel()
) {
    val currentTab by viewModel.currentTab.collectAsStateWithLifecycle()
    val languageMode by viewModel.languageMode.collectAsStateWithLifecycle()
    val activeShop by viewModel.activeShop.collectAsStateWithLifecycle()
    val allShops by viewModel.shops.collectAsStateWithLifecycle()
    val lowStockIds by viewModel.lowStockProductIds.collectAsStateWithLifecycle()
    val uiMessage by viewModel.uiMessage.collectAsStateWithLifecycle()

    val previewInvoice by viewModel.previewInvoice.collectAsStateWithLifecycle()
    val previewItems by viewModel.previewInvoiceItems.collectAsStateWithLifecycle()
    val printFormat by viewModel.invoicePrintFormat.collectAsStateWithLifecycle()
    val printLanguage by viewModel.invoicePrintLanguage.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }

    // Handle back button: return to POS billing if currently in another tab
    BackHandler(enabled = currentTab != ScreenTab.POS_BILLING) {
        viewModel.setTab(ScreenTab.POS_BILLING)
    }

    LaunchedEffect(uiMessage) {
        uiMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearUiMessage()
        }
    }

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        val isExpandedScreen = maxWidth >= 900.dp

        if (isExpandedScreen) {
            // Large screen / tablet POS: Navigation Rail on the left
            Row(modifier = Modifier.fillMaxSize()) {
                NavigationRail(
                    containerColor = PrimaryIndigo,
                    contentColor = Color.White,
                    modifier = Modifier.fillMaxHeight()
                ) {
                    NavigationRailItem(
                        selected = currentTab == ScreenTab.POS_BILLING,
                        onClick = { viewModel.setTab(ScreenTab.POS_BILLING) },
                        icon = { Icon(Icons.Default.PointOfSale, contentDescription = "POS") },
                        label = { Text("POS", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_rail_pos")
                    )
                    NavigationRailItem(
                        selected = currentTab == ScreenTab.PRODUCTS,
                        onClick = { viewModel.setTab(ScreenTab.PRODUCTS) },
                        icon = { Icon(Icons.Default.Category, contentDescription = "Products") },
                        label = { Text("Products", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_rail_products")
                    )
                    NavigationRailItem(
                        selected = currentTab == ScreenTab.COMPANY_STOCK,
                        onClick = { viewModel.setTab(ScreenTab.COMPANY_STOCK) },
                        icon = { Icon(Icons.Default.Business, contentDescription = "Companies") },
                        label = { Text("Companies", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_rail_companies")
                    )
                    NavigationRailItem(
                        selected = currentTab == ScreenTab.CUSTOMERS,
                        onClick = { viewModel.setTab(ScreenTab.CUSTOMERS) },
                        icon = { Icon(Icons.Default.People, contentDescription = "Customers") },
                        label = { Text("Customers", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_rail_customers")
                    )
                    NavigationRailItem(
                        selected = currentTab == ScreenTab.INVOICES,
                        onClick = { viewModel.setTab(ScreenTab.INVOICES) },
                        icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "Invoices") },
                        label = { Text("Invoices", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_rail_invoices")
                    )
                    NavigationRailItem(
                        selected = currentTab == ScreenTab.MULTI_SHOP,
                        onClick = { viewModel.setTab(ScreenTab.MULTI_SHOP) },
                        icon = { Icon(Icons.Default.Store, contentDescription = "Shops") },
                        label = { Text("Shops", fontSize = 11.sp) },
                        modifier = Modifier.testTag("nav_rail_shops")
                    )
                }

                Scaffold(
                    topBar = {
                        PosHeader(
                            activeShop = activeShop,
                            allShops = allShops,
                            onSelectShop = { viewModel.setActiveShop(it) },
                            languageMode = languageMode,
                            onSelectLanguage = { viewModel.setLanguageMode(it) },
                            lowStockCount = lowStockIds.size,
                            onLowStockClick = { viewModel.setTab(ScreenTab.PRODUCTS) }
                        )
                    },
                    snackbarHost = { SnackbarHost(snackbarHostState) },
                    modifier = Modifier.fillMaxSize()
                ) { innerPadding ->
                    when (currentTab) {
                        ScreenTab.POS_BILLING -> PosBillingScreen(viewModel, modifier = Modifier.padding(innerPadding))
                        ScreenTab.PRODUCTS -> ProductMasterScreen(viewModel, modifier = Modifier.padding(innerPadding))
                        ScreenTab.COMPANY_STOCK -> CompanyStockScreen(viewModel, modifier = Modifier.padding(innerPadding))
                        ScreenTab.CUSTOMERS -> CustomerRegisterScreen(viewModel, modifier = Modifier.padding(innerPadding))
                        ScreenTab.INVOICES -> InvoiceHistoryScreen(viewModel, modifier = Modifier.padding(innerPadding))
                        ScreenTab.MULTI_SHOP -> MultiShopScreen(viewModel, modifier = Modifier.padding(innerPadding))
                    }
                }
            }
        } else {
            // Standard / Mobile: Top Bar & Bottom Navigation Bar
            Scaffold(
                topBar = {
                    PosHeader(
                        activeShop = activeShop,
                        allShops = allShops,
                        onSelectShop = { viewModel.setActiveShop(it) },
                        languageMode = languageMode,
                        onSelectLanguage = { viewModel.setLanguageMode(it) },
                        lowStockCount = lowStockIds.size,
                        onLowStockClick = { viewModel.setTab(ScreenTab.PRODUCTS) }
                    )
                },
                bottomBar = {
                    NavigationBar(
                        containerColor = PrimaryIndigo,
                        contentColor = Color.White
                    ) {
                        NavigationBarItem(
                            selected = currentTab == ScreenTab.POS_BILLING,
                            onClick = { viewModel.setTab(ScreenTab.POS_BILLING) },
                            icon = { Icon(Icons.Default.PointOfSale, contentDescription = "POS", modifier = Modifier.size(20.dp)) },
                            label = { Text("POS", fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AccentTeal,
                                selectedTextColor = AccentTeal,
                                unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                unselectedTextColor = Color.White.copy(alpha = 0.7f),
                                indicatorColor = Color.White.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.testTag("nav_bottom_pos")
                        )
                        NavigationBarItem(
                            selected = currentTab == ScreenTab.PRODUCTS,
                            onClick = { viewModel.setTab(ScreenTab.PRODUCTS) },
                            icon = { Icon(Icons.Default.Category, contentDescription = "Products", modifier = Modifier.size(20.dp)) },
                            label = { Text("Products", fontSize = 10.sp) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AccentTeal,
                                selectedTextColor = AccentTeal,
                                unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                unselectedTextColor = Color.White.copy(alpha = 0.7f),
                                indicatorColor = Color.White.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.testTag("nav_bottom_products")
                        )
                        NavigationBarItem(
                            selected = currentTab == ScreenTab.COMPANY_STOCK,
                            onClick = { viewModel.setTab(ScreenTab.COMPANY_STOCK) },
                            icon = { Icon(Icons.Default.Business, contentDescription = "Company", modifier = Modifier.size(20.dp)) },
                            label = { Text("Company", fontSize = 10.sp) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AccentTeal,
                                selectedTextColor = AccentTeal,
                                unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                unselectedTextColor = Color.White.copy(alpha = 0.7f),
                                indicatorColor = Color.White.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.testTag("nav_bottom_companies")
                        )
                        NavigationBarItem(
                            selected = currentTab == ScreenTab.CUSTOMERS,
                            onClick = { viewModel.setTab(ScreenTab.CUSTOMERS) },
                            icon = { Icon(Icons.Default.People, contentDescription = "Ledger", modifier = Modifier.size(20.dp)) },
                            label = { Text("Due Ledger", fontSize = 10.sp) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AccentTeal,
                                selectedTextColor = AccentTeal,
                                unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                unselectedTextColor = Color.White.copy(alpha = 0.7f),
                                indicatorColor = Color.White.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.testTag("nav_bottom_customers")
                        )
                        NavigationBarItem(
                            selected = currentTab == ScreenTab.INVOICES,
                            onClick = { viewModel.setTab(ScreenTab.INVOICES) },
                            icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "Invoices", modifier = Modifier.size(20.dp)) },
                            label = { Text("Invoices", fontSize = 10.sp) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AccentTeal,
                                selectedTextColor = AccentTeal,
                                unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                unselectedTextColor = Color.White.copy(alpha = 0.7f),
                                indicatorColor = Color.White.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.testTag("nav_bottom_invoices")
                        )
                        NavigationBarItem(
                            selected = currentTab == ScreenTab.MULTI_SHOP,
                            onClick = { viewModel.setTab(ScreenTab.MULTI_SHOP) },
                            icon = { Icon(Icons.Default.Store, contentDescription = "Shops", modifier = Modifier.size(20.dp)) },
                            label = { Text("Shops", fontSize = 10.sp) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AccentTeal,
                                selectedTextColor = AccentTeal,
                                unselectedIconColor = Color.White.copy(alpha = 0.7f),
                                unselectedTextColor = Color.White.copy(alpha = 0.7f),
                                indicatorColor = Color.White.copy(alpha = 0.15f)
                            ),
                            modifier = Modifier.testTag("nav_bottom_shops")
                        )
                    }
                },
                snackbarHost = { SnackbarHost(snackbarHostState) },
                modifier = Modifier.fillMaxSize()
            ) { innerPadding ->
                when (currentTab) {
                    ScreenTab.POS_BILLING -> PosBillingScreen(viewModel, modifier = Modifier.padding(innerPadding))
                    ScreenTab.PRODUCTS -> ProductMasterScreen(viewModel, modifier = Modifier.padding(innerPadding))
                    ScreenTab.COMPANY_STOCK -> CompanyStockScreen(viewModel, modifier = Modifier.padding(innerPadding))
                    ScreenTab.CUSTOMERS -> CustomerRegisterScreen(viewModel, modifier = Modifier.padding(innerPadding))
                    ScreenTab.INVOICES -> InvoiceHistoryScreen(viewModel, modifier = Modifier.padding(innerPadding))
                    ScreenTab.MULTI_SHOP -> MultiShopScreen(viewModel, modifier = Modifier.padding(innerPadding))
                }
            }
        }
    }

    // Invoice Preview & Print Modal
    if (previewInvoice != null) {
        InvoicePreviewDialog(
            invoice = previewInvoice!!,
            items = previewItems,
            initialFormat = printFormat,
            initialLanguage = printLanguage,
            onDismiss = { viewModel.closeInvoicePreview() }
        )
    }
}
