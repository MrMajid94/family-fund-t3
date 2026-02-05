# Arabic UI Rule

When generating or modifying UI components for this project:

1. **All user-facing text MUST be in Arabic (العربية)**
2. **Use RTL (right-to-left) layout direction**
3. **Use Arabic-friendly fonts** (Cairo, Tajawal, or similar)
4. **Format numbers and dates** according to Arabic conventions
5. **Currency**: Display as "ر.ع" (Omani Rial) with Arabic numerals when appropriate

## Examples

- Buttons: "تسجيل الدخول" not "Login"
- Labels: "رقم الهاتف" not "Phone Number"  
- Messages: "تم بنجاح" not "Success"
- Navigation: "الرئيسية" not "Home"

## Technical Implementation

- Set `dir="rtl"` on HTML elements
- Set `lang="ar"` on the root element
- Use CSS logical properties (e.g., `margin-inline-start` instead of `margin-left`)
