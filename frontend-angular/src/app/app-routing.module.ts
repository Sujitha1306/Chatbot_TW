import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { ChatLayoutComponent } from './features/chat/chat-layout/chat-layout.component';
import { ChatWelcomeComponent } from './features/chat/chat-welcome/chat-welcome.component';
import { ChatThreadComponent } from './features/chat/chat-thread/chat-thread.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: 'chat',
    component: ChatLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: ChatWelcomeComponent },
      { path: ':conversationId', component: ChatThreadComponent },
    ],
  },
  { path: '', redirectTo: '/chat', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
