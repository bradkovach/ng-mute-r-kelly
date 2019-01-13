export interface IPaging<T> {
	items: T[];
	href: string;
	limit: number;
	next: string;
	offset: number;
	previous: string;
	total: number;
}

