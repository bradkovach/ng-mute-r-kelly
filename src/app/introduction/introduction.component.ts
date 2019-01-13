import { environment } from './../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SpotifyService } from '../spotify.service';
import { Location } from '@angular/common';

@Component({
	selector: 'app-introduction',
	templateUrl: './introduction.component.html',
	styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent implements OnInit {
	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private spotifyService: SpotifyService,
		private location: Location
	) {}

	ngOnInit() {
	}

	getAuthorizeUrl() {
		return this.spotifyService.getAuthorizeUrl();
	}

}
