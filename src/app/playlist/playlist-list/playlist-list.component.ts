import { environment } from './../../../environments/environment';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, UrlSerializer } from '@angular/router';
import { SpotifyService, IDeletedResult } from '../../spotify.service';
import { ISimplifiedPlaylist } from '../../model/IPlaylistHeader';
import { IPaging } from '../../model/Paged';
import { IUser } from '../../model/User';
import { of, defer, from, EMPTY, concat, merge } from 'rxjs';
import { mergeMap, map, tap } from 'rxjs/operators';
import { when } from 'q';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
	selector: 'app-playlist-list',
	templateUrl: './playlist-list.component.html',
	styleUrls: ['./playlist-list.component.scss']
})
export class PlaylistListComponent implements OnInit {
	readonly playlistsPerPage = 50;

	me: IUser;
	playlists: IPaging<ISimplifiedPlaylist>;
	currentPage: number;
	availablePages: number[] = [1];
	status = 'Ready to process.';
	removing = false;
	results: IAutoRemoveResult;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private spotifyService: SpotifyService,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit() {
		this.spotifyService
			.getUser()
			.toPromise()
			.then(me => (this.me = me))

			.then(newMe => {
				this.route.queryParams.subscribe(queryParams => {
					console.log({ queryParams });
					this.currentPage = parseInt(queryParams['page'] || 1, 10);
					this.setPage(this.currentPage);
				});
			})
			.catch(noAccessToken =>
				this.router.navigateByUrl('/', {
					state: {
						redirect: this.router.url
					}
				})
			);
	}

	/**
	 *
	 * @param targetPage a number greater than 0 (ie, 1 or more);
	 */
	setPage(targetPage) {
		return this.spotifyService
			.ensureAccessToken()
			.getMyPlaylists(50, 50 * (targetPage - 1))
			.subscribe(playlists => {
				this.playlists = playlists;
				const totalPages = Math.ceil(
					this.playlists.total / this.playlistsPerPage
				);
				this.availablePages = [];
				for (let page = 1; page <= totalPages; page++) {
					this.availablePages.push(page);
				}
				this.currentPage = targetPage;
			});
	}

	getTweet() {
		if (this.results) {
			return `I removed ${
				this.results.total
			} R. Kelly tracks from ${
				this.results.playlistsProcessed
			} Spotify playlists! Remove R. Kelly from your library with a few clicks! ${
				environment.appLink
			}`;
		} else {
			return `Automatically remove R. Kelly music from your Spotify playlists. #MuteRKelly ${
				environment.appLink
			}`;
		}
	}

	getTweetLink() {

		return this.sanitizer.bypassSecurityTrustUrl(`http://twitter.com/home?status=${encodeURIComponent(this.getTweet())}`);
	}

	autoRemove() {
		this.status = 'Loading all playlists...';
		this.removing = true;
		this.spotifyService
			.getAllUserPlaylists()
			.pipe(tap(res => (this.status = `Loaded ${res.length} playlists.`)))
			.toPromise()
			.then(playlists =>
				playlists
					.filter(playlist => this.me.id === playlist.owner.id)
					.reduce(
						(
							lastPromise: Promise<IAutoRemoveResult>,
							currentPlaylist: ISimplifiedPlaylist,
							playlistIdx: number,
							array: ISimplifiedPlaylist[]
						) => {
							return lastPromise.then(last => {
								if (last.result !== null) {
									if (last.result.tracks.length > 0) {
										this.status = `(${playlistIdx + 1}/${
											array.length
										}) Removed ${
											last.result.tracks.length
										} R.Kelly tracks from '${
											last.result.playlist.name
										}'`;
									} else {
										this.status = `(${playlistIdx + 1}/${
											array.length
										}) No R.Kelly tracks on playlist '${
											last.result.playlist.name
										}'`;
									}
								}
								return this.spotifyService
									.removeRKelly(currentPlaylist)
									.then(
										(result): IAutoRemoveResult => ({
											total:
												last.total +
												result.tracks.length,
											playlistsProcessed:
												last.playlistsProcessed + 1,
											result: result
										})
									);
							});
						},
						new Promise((resolve, reject) =>
							resolve({
								total: 0,
								playlistsProcessed: 0,
								result: null
							})
						)
					)
			)
			.then(allDone => {
				this.removing = false;
				this.results = allDone;
				this.status = `Auto Clean complete.  Removed ${
					allDone.total
				} R. Kelly tracks from ${
					allDone.playlistsProcessed
				} playlists.`;
			});
	}
}

interface IAutoRemoveResult {
	total: number;
	playlistsProcessed: number;
	result: IDeletedResult;
}
