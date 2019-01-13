import { IExternalUrls } from './ExternalUrls';

export interface IArtist {
	external_urls: IExternalUrls;
	href: string;
	id: string;
	name: string;
	type: 'artist';
	uri: string;
}
