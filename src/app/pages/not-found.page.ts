import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.page.html',
  styleUrl: './not-found.page.css'
})
export class NotFoundPage {}
