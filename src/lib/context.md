# صندوق عائلة الشكيلي - Al Shukaili Family Fund

## نظرة عامة | Overview

A web application for members of the **Al Shukaili family** (عائلة الشكيلي) to track and log their contributions to the family fund. The entire UI is in **Arabic** with RTL (right-to-left) layout support.

---

## Core Functionality

### 1. User Authentication

- **Login Method**: Phone number serves as both username and password
- Users are manually seeded into the database by an admin
- No self-registration - only pre-registered family members can access the system

### 2. Payment Year Management (إدارة سنوات الدفع)

- **Enabled Years**: Admins enable payment years from the dashboard
  - Example: Enable 2026 to allow users to pay for months in 2026
  - Only months within enabled years are available for payment
- Year enablement is controlled via the admin dashboard
- New years must be explicitly enabled before users can make payments for them

### 3. Monthly Contributions

- **Default Contribution**: 10 OMR (Omani Rial) per month
- Members can pay more or less than the default amount
- **Payment Due Date**: Last day of the month
  - Example: January payment is due by January 31st
- Support for **bulk payments** (e.g., paying for a full year at once)

### 4. Payment Status & Selection

- **Missed Payments**: Months where no payment has been recorded
- **Overdue Payments**: Missed payments past their due date (highlighted in red)
  - Example: If today is Feb 6th, January payment is overdue
- **Advance Payments**: Users can pay for future months within enabled years
  - Example: In January, user can pay for March, April, etc.
- Users select which month(s) to pay when logging a payment

### 5. Payment Logging

- Manual bank transfer logging only (no online payment integration)
- Users specify which month(s) they are paying for
- Multi-month selection allowed for bulk payments
- Simple, easy-to-use payment form
- Each payment record stores:
  - `paymentDate`: When the payment was made
  - `paymentForMonth`: Which month this payment covers (stored as Date)
  - `amount`: Payment amount
  - `note`: Optional notes
  - `proof`: Optional proof/receipt URL

### 6. Dashboard Features

- View list of **pending payments** (months not yet paid)
- View **overdue payments** (past due date, highlighted)
- View **payment history** (all logged payments)
- Quick overview of contribution status
- **Admin Dashboard**:
  - Enable/disable payment years
  - View all user payments
  - **Archived Payments**: View pre-2026 payments (admin only)
  - User management

### 7. Fund Spendings (مصروفات الصندوق)

- Log expenses from the fund
- Track amount, reason, recipient, date, and notes
- Visible to all users
- Only admins can Create, Update, Delete (CRUD)

---

## Technical Requirements

### Language & Localization

- **Primary Language**: Arabic (العربية)
- **Text Direction**: RTL (Right-to-Left)
- **Currency**: OMR (Omani Rial) - ريال عماني
- **Date Format**: Arabic/Hijri calendar support optional, Gregorian is primary

### User Experience

- Mobile-first design (most users will access via phone)
- Simple, intuitive interface
- Minimal steps to log a payment
- Clear visual indicators for pending vs paid months

---

## Data Models

### User (المستخدم)

```typescript
{
  id: string;
  phoneNumber: string; // رقم الهاتف - used as username/password
  fullName: string; // الاسم الكامل
  isActive: boolean; // حالة الحساب (default: true)
  role: "admin" | "user"; // صلاحية المستخدم
  paymentStartDate: Date; // تاريخ بداية الالتزام بالدفع - when payment obligation begins
  createdAt: Date;
}
```

> [!IMPORTANT]
> **Payment Accountability Rules:**
>
> - **New users**: Admins set `paymentStartDate` when adding a user to define when their payment obligation begins. No overdue payments appear for months before this date.
> - **Existing/seeded users**: `paymentStartDate` is set to fund establishment date (January 2022), making them accountable for all months since then.

### Payment (الدفعة) - For 2026+

```typescript
{
  id: string
  userId: string           // معرف المستخدم (User who the payment is for)
  createdById: string      // معرف من قام بالدفع (Who actually made the payment)
  amount: string           // المبلغ (default: "10" OMR) - stored as text
  paymentDate: Date        // تاريخ الدفع - when the payment was made
  paymentForMonth: Date    // الشهر المدفوع عنه - which month this covers
  note?: string            // ملاحظات
  proof?: string           // رابط إثبات الدفع (صورة الإيصال)
  createdAt: Date
  updatedAt: Date
}
```

### Archived Payment (الدفعة المؤرشفة) - Pre-2026

```typescript
{
  id: string
  userName: string         // اسم المستخدم (stored as text, not linked to User)
  amount: string
  paymentDate: Date
  paymentForMonth: Date
  note?: string
  proof?: string
  createdAt: Date
}
```

### Payment Year (سنة الدفع)

```typescript
{
  id: string;
  year: number; // السنة (e.g., 2025, 2026)
  monthlyAmount: string; // المبلغ الشهري (default: "10") - stored as text
  isEnabled: boolean; // مفعّلة/معطّلة
  createdAt: Date;
  updatedAt: Date;
}
```

### Contribution Period (فترة المساهمة)

```typescript
{
  month: string; // "2024-01" format
  dueDate: Date; // تاريخ الاستحقاق (5th of next month)
  defaultAmount: number; // المبلغ الافتراضي (10 OMR)
  status: "paid" | "pending" | "overdue"; // حالة الدفع
}
```

### Fund Spending (مصروفات الصندوق)

```typescript
{
  id: string
  amount: string           // المبلغ
  reason: string           // السبب
  recipient?: string       // المدفوع له (Optional)
  date: Date               // التاريخ
  note?: string            // ملاحظات
  createdById: string      // Created by User ID
  createdAt: Date
  updatedAt: Date
}
```

```

```

---

## User Flows

### Login Flow

1. User enters phone number
2. System validates against pre-seeded users
3. If valid → redirect to dashboard
4. If invalid → show error message

### View Pending Payments

1. Dashboard shows list of unpaid months
2. Each month shows: month name, due date, default amount
3. Overdue payments highlighted in red/warning color

### Log New Payment

1. Click "تسجيل دفعة جديدة" (Log New Payment)
2. Select month(s) to pay for (multi-select)
3. Enter amount (pre-filled with calculated default)
4. Add optional notes
5. Submit → confirmation message

### View Payment History

1. Access "سجل الدفعات" (Payment History)
2. See list of all logged payments
3. Each entry shows: date, amount, months covered

---

## Pages Structure

| Route                  | Page            | Description                   |
| ---------------------- | --------------- | ----------------------------- |
| `/`                    | Login           | Phone number login            |
| `/dashboard`           | Dashboard       | Overview, pending payments    |
| `/payments`            | Payment History | List of all payments          |
| `/payments/new`        | New Payment     | Form to log payment           |
| `/dashboard/spendings` | Fund Spendings  | View and manage fund expenses |

---

## Admin Notes

- Users are seeded manually via database or seed script
- **Admin Dashboard Features**:
  - **Year Management**: Enable/disable payment years to control which years users can make payments for
  - **Payment Overview**: View all payments from all users
  - **User Management**: Manage family members
  - **Fund Spendings**: Full CRUD access to manage fund expenses
- Admins have full access to all user payment data

---

## Design Guidelines

- Clean, minimal Arabic typography
- Use Arabic-friendly fonts (e.g., Cairo, Tajawal)
- Green color scheme (traditional, trustworthy)
- Large touch targets for mobile
- Clear visual hierarchy
