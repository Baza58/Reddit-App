require('./style.scss');
import RedditApp from './app';

// search for input and focus on it on page load
const input = document.querySelector('.form-input');
input.focus();

// create the app and initialize it
const app = new RedditApp({
	input,
	form: document.querySelector('.form'),
	spinner: document.querySelector('.form-spinner'),
	errorBox: document.querySelector('.form-error-box'),
	title: document.querySelector('.subreddit-title'),
	results: document.querySelector('.results'),
	container: document.querySelector('.results-content'),
	moreBtn: document.querySelector('.more-btn'),
	modalContainer: document.querySelector('.modal-container'),
	modal: document.querySelector('.modal-content'),
	modalSpinner: document.querySelector('.modal-spinner')
}); 

app.init();