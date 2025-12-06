# Role
Act as a Senior Full Stack Engineer and UI/UX Designer.

# Project Goal
Build a mobile-responsive "Household Management System" for a 3-person household using Next.js 14 (App Router) and PostgreSQL. The app must manage chores, specific recurring tasks, and shared finances with a modern, gamified, and "cool" UI.

# Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (for accessible, clean components)
- **Icons:** Lucide React (customizable icons for tasks)
- **Animations:** Framer Motion (for smooth transitions and a "cool" feel)
- **State/Data Fetching:** TanStack Query (React Query)

# Core Features & Requirements

## 1. User Management
- System supports exactly 3 distinct user profiles.
- Each user has an avatar, a color theme, and a "Balance" (for finances).

## 2. Chore Management (The Core)
- **Task creation:** Users can create tasks with a Title, Icon, Frequency (Daily, Weekly, Monthly, Custom), and Difficulty/Points.
- **Specific Seed Data:** Initialize the database with these specific chores:
  1. Dish washing
  2. Cleaning the house
  3. Taking out trash
  4. Cooking
  5. Going out for night watch
  6. Community cleaning
  7. Refining water reserve
  8. Carrying out jar for drinking water
- **Recurrence Logic:** When a task is marked "Done," the system must automatically generate the *next* instance of that task based on its frequency settings.
- **Undone/Overdue Tracking:** Tasks not completed by the deadline turn red and accumulate in a "Backlog" view.
- **Chore Transfer System:** - A user can "Request Transfer" of a chore to another user.
  - The other user receives a notification (toast/in-app alert) to Accept or Reject.
  - If accepted, the assignee updates immediately.

## 3. Comprehensive Planner (Calendar View)
- Implement a Calendar View (using a library like `react-big-calendar` or custom grid).
- Show dots/icons on days with tasks.
- Clicking a day expands to show the "Daily Agenda."

## 4. Finance & Budgeting
- **Shared Expenses:** Users can log an expense (e.g., "Bought Groceries").
- **Split Logic:** Ability to split costs equally (3 ways) or by custom percentages.
- **Settlement:** A "Who owes who" dashboard that calculates net balances between the 3 users.

## 5. UI/UX Design Requirements
- **Theme:** Dark mode by default with vibrant accent colors (Neon Blue, Purple, Teal).
- **Cards:** Use glassmorphism (frosted glass effect) for chore cards.
- **Interaction:** - Swipe-to-complete on mobile for chores.
  - Confetti explosion animation when clearing the backlog or finishing a hard task.
- **Dashboard:** A "At a Glance" view showing:
  - "My Tasks for Today"
  - "Next Up" (Upcoming chores)
  - "Household Notification" (e.g., "John requested you take over Night Watch").

# Database Schema Strategy (Prisma)
Please define models for:
- `User` (id, name, avatar, color)
- `Chore` (template for the task, frequency, icon)
- `ChoreInstance` (the actual scheduled event, due_date, status [PENDING, COMPLETED, MISSED], assigned_user_id)
- `TransferRequest` (from_user, to_user, chore_instance_id, status)
- `Expense` (amount, payer_id, description, date)
- `ExpenseSplit` (expense_id, debtor_id, amount_owed)

# Instructions
1. Set up the Prisma schema first.
2. Create the seed script with the specific chores listed above.
3. Build the "Dashboard" page with the specific UI requirements.
4. Implement the logic for "Chore Transfer" API endpoints.