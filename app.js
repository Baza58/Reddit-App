class App {
	constructor({form, input, spinner, errorBox, title, results, container, moreBtn, modalContainer, modal, modalSpinner}) {
		this.form = form;
		this.input = input;
		this.spinner = spinner;
		this.errorBox = errorBox;
		this.title = title;
		this.results = results;
		this.container = container;
		this.moreBtn = moreBtn;
		this.modalContainer = modalContainer;
		this.modal = modal;
		this.modalSpinner = modalSpinner;
	}
	createElem(node, text, parent, className) {
		const el = document.createElement(node);
		el.textContent = text;
		if (className) {
			el.classList.add(className);
		}
		parent.appendChild(el);
		return el;
	}
	init() {
		this.form.addEventListener('submit', this.onFormSubmit.bind(this));
		this.moreBtn.addEventListener('click', this.onMoreBtnClick.bind(this));
		this.modalContainer.addEventListener('click', this.hideModal.bind(this));
	}
	onMoreBtnClick(e) {
		this.fetchPosts(null, this.viewMoreUrl);
	}
	onFormSubmit(e) {
		e.preventDefault();
		
		// hide errorBox if it's visible
		this.errorBox.style.display = 'none';

		// get value of the input, if it's empty then return if not set title to the value, empty input and focus on it
		let val = this.input.value;
		if (val === '') return;
		this.title.textContent = val;
		this.input.value = '';
		this.input.focus();

		this.showSpinner();
		this.fetchPosts(val);
	}
	showModal() {
		this.modalSpinner.style.display = 'initial';
		this.modalContainer.style.display = 'flex';

		// prevent from scrolling the page
		document.body.style.height = '100vh';
		document.body.style.overflow = 'hidden';
	}
	hideModal(e) {
		if (e.target === this.modalContainer) {
			this.modalContainer.style.display = 'none';
			document.body.style.height = 'initial';
			document.body.style.overflow = 'auto';	
		}
	}
	showSpinner() {
		this.spinner.style.display = 'initial';
		this.container.style.display = 'none';

		// if there are nodes from previous searching then remove them
		while (this.results.firstChild) {
			this.results.removeChild(this.results.firstChild);
		}
	}
	fetchPosts(subreddit, viewMoreUrl) {
		let url = `http://www.reddit.com/r/${subreddit}.json`;	

		// if calling the function with the next page string then rewrite the url to fetch
		if (viewMoreUrl) {
			url = viewMoreUrl;
		}

		//fetch the posts and call renderPosts method with response data
		fetch(url)
			.then(response => response.json())
			.then(response => {

				// if the subreddit was not found display error
				if (response.error === 404) {
					this.showError({
						message: 'Subreddit not found'
					});
				}
				return response;
			})
			.then(response => this.renderPosts(response.data.children, response.data.after, url))
			.catch(err => this.showError(err));
	}
	decodeHtml(html) {
    	var txt = document.createElement("textarea");
    	txt.innerHTML = html;
    	return txt.value;
	}
	showError(err) {
		this.hideSpinner();
		this.errorBox.style.display = 'initial';
		this.errorBox.textContent = `Something went wrong. Error message: ${err.message}`;
		this.moreBtn.style.display = 'none';
	}
	renderPosts(posts, after, url) {

		//display button for pagination
		this.moreBtn.style.display = 'initial';
		this.hideSpinner();

		// call createNodes method to construct the nodes from the data
		const nodes = this.createNodes(posts);

		// if there are no nodes display error
		if (!nodes.length) {
			const error = document.createElement('h3');
			error.textContent = "Coudn't find any posts in this subreddit";
			this.results.appendChild(error);
		}
		nodes.map(node => {
			this.results.appendChild(node);
		});

		// set the pagination url to call after clicking the more button
		this.viewMoreUrl = `${url}?after=${after}`;
	}
	hideSpinner() {
		this.spinner.style.display = 'none';
		this.container.style.display = 'inherit';
	}
	fetchComments(url) {
		fetch(url)
			.then(response => response.json())
			.then(response => this.renderComments(response[1].data.children));
	}
	renderComments(data) {

		// create container for comments
		const div = document.createElement('div');
		div.classList.add('comments-container');

		// create the header link to the post link and append them to the container
		const link = document.createElement('a');
		link.href = this.lastClickedUrl;
		const heading = document.createElement('h1');
		heading.textContent = this.lastClickedTitle;
		link.appendChild(heading);
		div.appendChild(link);

		// map the comments data and create nodes
		const nodes = data.map(post => {
			const p = document.createElement('p');
			p.textContent = post.data.body;
			div.appendChild(p);

			// if there are replies then create them
			if (post.data.replies) {
				let secondLevel = document.createElement('div');
				secondLevel.classList.add('second-level');
				post.data.replies.data.children.map(reply => {
					let p = document.createElement('p');
					p.textContent = reply.data.body;
					secondLevel.appendChild(p);
				});
				div.appendChild(secondLevel);
			}
			return div;
		});
		nodes.map(post => {
			this.modal.appendChild(post);
		});
		this.modalSpinner.style.display = 'none';		
	}
	onCommentsClick(e) {
		// get the comments url from clicked node and fetch them
		let url = `http://www.reddit.com${e.target.getAttribute('data-url')}.json`;
		this.fetchComments(url);
	}
	createNodes(posts) {
		return posts.map(post => {
			// create wrapper around the post
			const wrapper = document.createElement('div');
			wrapper.classList.add('result-container');
			// create img and append it to permalink
			const permalink = document.createElement('a');
			permalink.href = post.data.permalink;
			permalink.classList.add('permalink');
			const img = document.createElement('img');
			img.classList.add('img')
			if (post.data.thumbnail === 'default' || post.data.thumbnail === 'self') {
				img.src = 'reddit.jpeg';
			} else {
				img.src = post.data.thumbnail;	
			}
			permalink.appendChild(img);
			
			// create other elements and append them to the wrapper
			const url = document.createElement('a');
			url.href = post.data.url;
			url.classList.add('link');
			url.setAttribute('target', '_blank');
			
			const text = document.createElement('div');
			text.appendChild(url);
		
			const score = document.createElement('p');
			score.textContent = `${post.data.score} upvotes`;
			score.classList.add('score');
			text.appendChild(score);

			const date = new Date(post.data.created * 1000).toLocaleString();
			const dateNode = this.createElem('p', date, text, 'date');
			const author = this.createElem('p', post.data.author, text, 'author');
			const title = this.createElem('h2', this.decodeHtml(post.data.title), url, 'title');
			const domain = this.createElem('span', post.data.domain, title, 'domain');
			
			const comments = document.createElement('p');
			comments.textContent = `${post.data.num_comments} comments`;
			comments.classList.add('comments');
			comments.setAttribute('data-url', post.data.permalink);
			comments.addEventListener('click', e => {		
				const comments = document.querySelector('.comments-container');
				if (comments) {
					this.modal.removeChild(comments);							
				}
				this.showModal();
				this.lastClickedTitle = post.data.title;
				this.lastClickedUrl = post.data.url;
				this.onCommentsClick(e);
			});
			text.appendChild(comments);

			wrapper.appendChild(text);
			wrapper.appendChild(permalink);

			return wrapper;			
		});
	}
}

export default App;