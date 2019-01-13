import { IExternalIds } from './ExternalIds';
import { IAlbum } from './Album';
import { IArtist } from './Artist';
import { IExternalUrls } from './ExternalUrls';

export interface ITrack {
	album: IAlbum;
	artists: IArtist[];
	available_markets: string[];
	disc_number: number;
	duration_ms: number;
	episode: boolean;
	explicit: boolean;
	external_ids: IExternalIds;
	external_urls: IExternalUrls;
	href: string;
	id: string;
	is_local: boolean;
	name: string;
	popularity: number;
	preview_url: string;
	track: boolean;
	track_number: number;
	type: 'track';
	uri: string;
}
