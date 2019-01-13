import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SpotifyService } from '../../spotify.service';
import * as moment from 'moment';

import {
	ISimplifiedPlaylist,
	IPlaylistTrack
} from '../../model/IPlaylistHeader';
import { IArtist } from '../../model/Artist';
import { IUser } from '../../model/User';

@Component({
	selector: 'app-playlist-detail',
	templateUrl: './playlist-detail.component.html',
	styleUrls: ['./playlist-detail.component.scss']
})
export class PlaylistDetailComponent implements OnInit {
	me: IUser;
	playlist: ISimplifiedPlaylist;
	tracks: IPlaylistTrack[];
	updated: Date;
	status: string = 'Ready to process';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private spotifyService: SpotifyService
	) {}

	ngOnInit() {
		this.spotifyService
			.getUser()
			.toPromise()
			.then(me => (this.me = me))
			.then(meUpdated =>
				this.route.params.subscribe(params =>
					this.loadPlaylist(params['playlistId'])
				)
			)
			.catch(noAccessToken =>
				this.router.navigateByUrl('/', {
					state: {
						redirect: this.router.url
					}
				})
			);
	}

	loadPlaylist(playlist_id: string): Promise<Date> {
		return this.spotifyService
			.getPlaylist(playlist_id)
			.toPromise()
			.then(refreshedPlaylist => {
				return (this.playlist = refreshedPlaylist);
			})
			.then(updatedPlaylist =>
				this.spotifyService
					.getAllPlaylistTracks(updatedPlaylist.id)
					.toPromise()
			)
			.then(refreshedTracks => {
				return (this.tracks = refreshedTracks);
			})
			.then(updatedTracks => {
				return (this.updated = new Date());
			});
	}

	timeAgoInWords(timestamp: string): string {
		return moment(timestamp).fromNow();
	}

	prettyDuration(duration: string | number) {
		const d = moment.duration(duration);
		const parts = [];
		if (d.hours() > 0) {
			parts.push(d.hours().toString());
		}
		parts.push(
			d.minutes() < 10
				? '0' + d.minutes().toString()
				: d.minutes().toString()
		);
		parts.push(
			d.seconds() < 10
				? '0' + d.seconds().toString()
				: d.seconds().toString()
		);

		return parts.join(':');
	}

	getPlaylistDuration(tracks: IPlaylistTrack[]) {
		const mmt = moment.duration(
			tracks
				.filter(track => !track.is_local )
				.map(track => track.track.duration_ms)
				.reduce((total, curr) => total + curr, 0)
		);
		const parts = [];
		if (mmt.days() > 0) {
			parts.push(mmt.days().toString() + ' day');
		}
		if (mmt.hours() > 0) {
			parts.push(mmt.hours().toString() + ' hr');
		}
		if (mmt.minutes() > 0) {
			parts.push(mmt.minutes() + ' min');
		}

		return parts.join(' ');
	}

	canAutoRemove(): boolean {
		return this.me.id === this.playlist.owner.id;
	}

	removeRKelly() {
		if (this.canAutoRemove()) {
			this.status = 'Processing playlist...';
			return this.spotifyService
				.removeRKelly(this.playlist)
				.then(removed => {
					this.status = `Removed ${
						removed.tracks.length
					} R. Kelly tracks.`;
					return this.loadPlaylist(this.playlist.id);
				});
		}
	}
}
