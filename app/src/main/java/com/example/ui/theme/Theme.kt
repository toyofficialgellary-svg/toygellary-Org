package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

private val DarkColorScheme = darkColorScheme(
    primary = AccentTeal,
    onPrimary = Color.White,
    primaryContainer = PrimaryDark,
    onPrimaryContainer = Color.White,
    secondary = ToyAmber,
    onSecondary = Color.Black,
    tertiary = AccentCyan,
    background = SurfaceDark,
    surface = SurfaceCardDark,
    surfaceVariant = Color(0xFF1E293B),
    onBackground = TextPrimaryDark,
    onSurface = TextPrimaryDark,
    error = DueCrimson,
    onError = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryIndigo,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF0F172A),
    onPrimaryContainer = Color.White,
    secondary = AccentTeal,
    onSecondary = Color.White,
    tertiary = ToyAmber,
    background = SurfaceLight,
    surface = SurfaceCardLight,
    surfaceVariant = Color(0xFFF1F5F9),
    onBackground = TextPrimaryLight,
    onSurface = TextPrimaryLight,
    error = DueCrimson,
    onError = Color.White
)

@Composable
fun MyApplicationTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Keep branded Toy Gallery POS palette consistent
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
