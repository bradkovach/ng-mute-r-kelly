import { IArtist } from './Artist';
import { IExternalUrls } from './ExternalUrls';
import { IImage } from './IImage';

export interface IAlbum {
	album_type: string;
	artists: IArtist[];
	available_markets: string[];
	external_urls: IExternalUrls;
	href: string;
	id: string;
	images: IImage[];
	name: string;
	release_date_precision: 'day';
	release_date: string;
	total_tracks: number;
	type: 'album';
	uri: string;
}
