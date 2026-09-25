# Perfil unificado GastoAR

Se unificó la experiencia de "Mi Perfil" en una sola pantalla responsive.

## Cambios
- Datos personales y edición.
- Estado de cuenta: personal o cuenta compartida.
- Plan de suscripción actual.
- Estado de suscripción.
- Período de prueba y días restantes cuando existe `trialEndsDate`.
- Próxima renovación y ciclo de facturación.
- Acceso a planes/suscripción.
- Código de Cuenta Compartida.
- Sincronización en la nube.
- Acceso a configuración.
- Ayuda y cierre de sesión.
- Diseño responsive para escritorio y móvil.
- Paleta basada en #9333EA y #F95420 sobre fondo claro.

## Unificación
Los accesos al perfil desde Header/Sidebar ahora llevan a `activeTab === 'profile'`, que utiliza `src/components/mobileScreens/ProfileScreen.tsx`.
La ventana `UserProfileModal` se conserva en el proyecto para evitar una eliminación destructiva, pero deja de ser el flujo principal de perfil.

## Seguridad
La contraseña no se muestra en la nueva interfaz de perfil.
