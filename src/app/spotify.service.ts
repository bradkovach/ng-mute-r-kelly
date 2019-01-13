import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, EMPTY, forkJoin } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Location } from '@angular/common';
import {
	ISimplifiedPlaylist,
	IPlaylistTrack,
	IPlaylist
} from './model/IPlaylistHeader';
import { ITrack } from './model/Track';
import { ISnapshotId } from './model/SnapshotId';
import { IPaging } from './model/Paged';
import { expand, map, reduce, tap } from 'rxjs/operators';
import { IUser } from './model/User';

import _ from 'lodash';

export interface IAuthorizationMap {
	access_token?: string;
	expires_in?: string; // number string
	state?: string;
	token_type?: 'Bearer';
}
export interface IDeletedResult {
	tracks: ITrack[];
	playlist?: ISimplifiedPlaylist;
	snapshot_ids: string[];
}

@Injectable({
	providedIn: 'root'
})
export class SpotifyService {
	public static apiBase = 'https://api.spotify.com/v1';

	private _accessToken: string;
	private _expiration: number;
	private _tokenType: string;
	private _state: string;

	constructor(
		private router: Router,
		private http: HttpClient,
		private location: Location
	) {}

	getHeaders() {
		return new HttpHeaders({
			Authorization: `${this._tokenType} ${this._accessToken}`
		});
	}

	setAuthorization(authorizationMap: IAuthorizationMap): this {
		if (authorizationMap.access_token) {
			this.setAccessToken(authorizationMap.access_token);
		}

		if (authorizationMap.expires_in) {
			this.setExpiration(
				new Date().getTime() +
					parseInt(authorizationMap.expires_in, 10) * 1000
			);
		}

		if (authorizationMap.token_type) {
			this.setTokenType(authorizationMap.token_type);
		}

		if (authorizationMap.state) {
			this.setState(authorizationMap.state);
		}
		return this;
	}

	getAuthorizeUrl() {
		const url = 'https://accounts.spotify.com/authorize';
		const params = {
			client_id: environment.spotifyClientId,
			redirect_uri: encodeURIComponent(
				[window.location.href, 'authorize'].join('')
			),
			scope: encodeURIComponent(
				[
					'playlist-read-private',
					'user-read-private',
					'playlist-modify-public',
					'playlist-modify-private'
				].join(' ')
			),
			response_type: 'token',
			state: ''
		};
		return (
			url +
			'?' +
			Object.keys(params)
				.map(param => `${param}=${params[param]}`)
				.join('&')
		);
	}

	ensureAccessToken(): this {
		if (this._accessToken) {
			return this;
		} else {
			throw new Error('no-access-token');
		}
	}

	setAccessToken(accessToken: string): this {
		this._accessToken = accessToken;
		return this;
	}

	getAccessToken(): Observable<string> {
		return of(this._accessToken);
	}

	setExpiration(expiration: number): this {
		this._expiration = expiration;
		return this;
	}

	setTokenType(tokenType: string): this {
		this._tokenType = tokenType;
		return this;
	}

	setState(state: string): this {
		this._state = state;
		return this;
	}

	getUser(): Observable<IUser> {
		return this.http.get<IUser>([SpotifyService.apiBase, 'me'].join('/'), {
			headers: this.getHeaders()
		});
	}

	getMyPlaylists(
		limit = 50,
		offset = 0
	): Observable<IPaging<ISimplifiedPlaylist>> {
		return this.http.get<IPaging<ISimplifiedPlaylist>>(
			[SpotifyService.apiBase, 'me', 'playlists'].join('/'),
			{
				headers: this.getHeaders(),
				params: {
					limit: limit.toString(),
					offset: offset.toString()
				}
			}
		);
	}

	getAllUserPlaylists(): Observable<ISimplifiedPlaylist[]> {
		const playlistsPerPage = 50;
		return this.getMyPlaylists(playlistsPerPage, 0).pipe(
			expand((page, i) =>
				page.next
					? this.getMyPlaylists(
							playlistsPerPage,
							(i + 1) * playlistsPerPage
					  )
					: EMPTY
			),
			map(res => res.items),
			reduce((acc, curr) => [...acc, ...curr], [])
		);
	}

	getPlaylist(
		playlistId: string,
		limit: number = 50,
		offset: number = 0
	): Observable<ISimplifiedPlaylist> {
		return this.http.get<ISimplifiedPlaylist>(
			[SpotifyService.apiBase, 'playlists', playlistId].join('/'),
			{
				headers: this.getHeaders(),
				params: {
					limit: limit.toString(),
					offset: offset.toString()
				}
			}
		);
	}

	getPlaylistTracks(
		playlist_id: string,
		limit: number = 50,
		offset: number = 0
	): Observable<IPaging<IPlaylistTrack>> {
		return this.http.get<IPaging<IPlaylistTrack>>(
			[SpotifyService.apiBase, 'playlists', playlist_id, 'tracks'].join(
				'/'
			),
			{
				headers: this.getHeaders(),
				params: {
					limit: limit.toString(),
					offset: offset.toString()
				}
			}
		);
	}

	getAllPlaylistTracks(playlist_id): Observable<IPlaylistTrack[]> {
		const playlistsPerPage = 100;
		return this.getPlaylistTracks(playlist_id, playlistsPerPage, 0).pipe(
			expand((page, idx) =>
				page.next
					? this.getPlaylistTracks(
							playlist_id,
							playlistsPerPage,
							(idx + 1) * playlistsPerPage
					  )
					: EMPTY
			),
			map(page => page.items),
			reduce((acc, curr) => [...acc, ...curr], [])
		);
	}

	removeTracksFromPlaylist(
		playlistId: string,
		tracks: ITrack[]
	): Observable<IDeletedResult> {
		const body = {
			tracks: tracks.map(track => ({ uri: track.uri }))
		};
		console.log(body);
		if (body.tracks.length === 0) {
			return of({ snapshot_ids: [], tracks: tracks });
		} else {
			return this.http
				.request<ISnapshotId>(
					'delete',
					[
						SpotifyService.apiBase,
						'playlists',
						playlistId,
						'tracks'
					].join('/'),
					{
						headers: this.getHeaders(),
						body: body
					}
				)
				.pipe(
					map(res => ({
						snapshot_ids: [res.snapshot_id],
						tracks: tracks
					})),
					tap(console.log)
				);
		}
	}

	removeRKelly(playlist: ISimplifiedPlaylist): Promise<IDeletedResult> {
		return this.getAllPlaylistTracks(playlist.id)
			.toPromise()
			.then(tracks =>
				tracks
					.filter(
						track =>
							// Delete R. Kelly when he is the track's artist
							track.track.artists.findIndex(
								artist => artist.id === '2mxe0TnaNL039ysAj51xPQ'
							) > -1 ||
							// Delete R. Kelly when he is the track's album artist
							track.track.album.artists.findIndex(
								artist => artist.id === '2mxe0TnaNL039ysAj51xPQ'
							) > -1
					)
					.map(playlistTrack => playlistTrack.track)
			)
			.then(rKellyTracks => _.chunk(rKellyTracks, 100))
			.then((rKellyTrackPages: ITrack[][]) => {
				console.log({ rKellyTrackPages });
				if (rKellyTrackPages.length === 0) {
					return of({
						tracks: [],
						playlist: playlist,
						snapshot_ids: []
					}).toPromise();
				}
				return forkJoin(
					rKellyTrackPages.map(page =>
						this.removeTracksFromPlaylist(playlist.id, page)
					)
				)
					.pipe(tap(res => console.log(res)))
					.toPromise()
					.then(deleteResults => {
						return deleteResults.reduce(
							(acc, cur) => {
								return {
									tracks: [...acc.tracks, ...cur.tracks],
									playlist: acc.playlist,
									snapshot_ids: [
										...acc.snapshot_ids,
										...cur.snapshot_ids
									]
								};
							},
							{
								tracks: [],
								playlist: playlist,
								snapshot_ids: []
							}
						);
					});
			});
	}
}
