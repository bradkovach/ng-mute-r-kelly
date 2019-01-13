import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyService } from '../spotify.service';

@Component({
	selector: 'app-authorize',
	templateUrl: './authorize.component.html',
	styleUrls: ['./authorize.component.scss']
})
export class AuthorizeComponent implements OnInit {
	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private spotifyService: SpotifyService
	) {}

	ngOnInit() {
		const paramsMap = {};
		this.route.fragment.subscribe(fragment => {
			if (fragment === null) {
				this.router.navigateByUrl('/');
			} else {
				const params = fragment.split('&');
				const props = params.map(paramString => paramString.split('='));
				props.forEach(propTuple => {
					paramsMap[propTuple[0]] = propTuple[1];
				});

				this.spotifyService.setAuthorization(paramsMap);
				this.router.navigateByUrl('/playlists');
			}
		});
	}
}
