import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/tasks',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () => import('./layout/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/presentation/task-list/task-list.page').then((m) => m.TaskListPage),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/presentation/category-list/category-list.page').then(
            (m) => m.CategoryListPage
          ),
      },
      {
        path: '',
        redirectTo: 'tasks',
        pathMatch: 'full',
      },
    ],
  },
];
