import { TasbihIcon, BudgetIcon } from '@/components/ui/BrandIcons.jsx'

// Add new destinations here after registering their routes in App.jsx.
export const workspaces = [
  { id: 'zekr', name: 'ذِكر', description: 'السبحة والأوراد', path: '/zekr/sabh', Icon: TasbihIcon },
  { id: 'budget', name: 'الميزانية', description: 'المعاملات والتقارير', path: '/budget/transactions', Icon: BudgetIcon },
]
