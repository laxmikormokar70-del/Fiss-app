package com.coaching.erp.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val PrimaryGreen = Color(0xFF16A34A)
val SecondaryDark = Color(0xFF0F172A)
val BackgroundLight = Color(0xFFF8FAFC)
val SurfaceWhite = Color(0xFFFFFFFF)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryGreen,
    secondary = SecondaryDark,
    background = BackgroundLight,
    surface = SurfaceWhite,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A)
)

@Composable
fun CoachingERPTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
