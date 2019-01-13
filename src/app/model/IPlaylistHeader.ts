import { IImage } from './IImage';
import { IExternalUrls } from './ExternalUrls';
import { ITrack } from './Track';

export interface IPlaylistFollowers {
	href: string;
	total: number;
}

export interface IPlaylistOwner {
	display_name: string;
	external_urls: IExternalUrls;
	href: string;
	id: string;
	type: string;
	uri: string;
}

export interface IPlaylistTracks {
	href: string;
	items: IPlaylistTrack[];
	limit: number;
	next: string;
	offset: number;
	previous: string;
	total: number;
}

export interface IPlaylistTrack {
	added_at: string;
	added_by: IPlaylistOwner;
	is_local: boolean;
	primary_color: string;
	track: ITrack;
	video_thumbnail: IVideoThumbnail;
}

export interface IVideoThumbnail {
	url: string;
}

export interface ISimplifiedPlaylist {
	collaborative: boolean;
	external_urls: IExternalUrls;
	href: string;
	id: string;
	images: IImage[];
	name: string;
	owner: IPlaylistOwner;
	public: boolean;
	snapshot_id: string;
	tracks: IPlaylistTracksReference;
}

export interface IPlaylistTracksReference {
	href: string;
	total: number;
}

export interface IPlaylist extends ISimplifiedPlaylist {
	description: string;
	followers: IPlaylistFollowers;
	primary_color: null;
	tracks: IPlaylistTracks;
}
