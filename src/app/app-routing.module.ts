import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlaylistComponent } from './playlist/playlist.component';
import { PlaylistListComponent } from './playlist/playlist-list/playlist-list.component';
import { PlaylistDetailComponent } from './playlist/playlist-detail/playlist-detail.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { AuthorizeComponent } from './authorize/authorize.component';

const routes: Routes = [
	{
		path: '',
		component: IntroductionComponent
	},
	{
		path: 'authorize',
		component: AuthorizeComponent
	},
	{
		path: 'playlists', // #/playlists
		component: PlaylistComponent,
		children: [
			{
				path: '', // #/playlists
				component: PlaylistListComponent
			},
			{
				path: ':playlistId',
				component: PlaylistDetailComponent
			}
		]
	},
	{
		path: '**',
		component: PageNotFoundComponent
	}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
			useHash: false
		})
	],
	exports: [RouterModule]
})
export class AppRoutingModule {}
