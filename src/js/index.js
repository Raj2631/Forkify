// Global app controller
import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";
/*
Global state of the app
* - Search object.
* - Current recipe object.
* - Shopping list object.
* - Liked recipes.
*/
const state = {};

const controlSearch = async () => {
    //Get the query from view.
    const query = searchView.getInput();

    if (query) {
        //New search object and add to state.
        state.search = new Search(query);

        //Prepare UI for results.
        searchView.clearInput();
        searchView.removeMarkup();
        renderLoader(elements.searchRes);

        try {
            //Search for recipes.
            await state.search.getResults();
            clearLoader();
            //Display results on UI.
            searchView.renderResults(state.search.result);
        } catch {
            alert("Something went wrong while searching...");
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener("submit", e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener("click", e => {
    const btn = e.target.closest(".btn-inline");
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.removeMarkup();
        searchView.renderResults(state.search.result, goToPage);
    }
});

//Recipe Controller

const controlRecipe = async () => {
    const id = window.location.hash.replace("#", "");

    if (id) {
        //Prepare UI for changes.
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item.
        if (state.search) searchView.highlightSelected(id);

        //Create new recipe object.

        state.recipe = new Recipe(id);

        try {
            //Get recipe data and parse ingredients.
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //Calculate servings and time.
            state.recipe.calcTime();
            state.recipe.calcServings();

            //Render recipe.
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        } catch (err) {
            alert("Something wrong with the recipe");
        }
    }
};

// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener("load", controlRecipe);
["hashchange", "load"].forEach(event =>
    window.addEventListener(event, controlRecipe)
);

//List controller.
const controllerList = () => {
    //Create a new list if there is none yet.
    if (!state.list) state.list = new List();

    //Add each ing to the list.
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

//Like controller.
state.likes = new Likes();
likesView.toggleLikeMenu(state.likes.getNumLikes());

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
    //User has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        //Add like to the state.
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //Toggle the like button.
        likesView.toggleLikeBtn(true);
        //Add Like to UI
        likesView.renderLike(newLike);
        //User has liked current recipe
    } else {
        //Remove like from the state.
        state.likes.deleteLike(currentID);
        //Toggle the like button.
        likesView.toggleLikeBtn(false);
        //Remove like from Ui list.
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

window.addEventListener("load", () => {
    state.likes = new Likes();

    //Restore likes
    state.likes.readStorage();

    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

//Handling recipe button clicks.

elements.recipe.addEventListener("click", e => {
    if (e.target.matches(".btn-decrease, .btn-decrease *")) {
        //Decrease button is clicked.
        if (state.recipe.servings > 1) {
            state.recipe.updateServings("dec");
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches(".btn-increase, .btn-increase *")) {
        //Increase button is clicked.
        state.recipe.updateServings("inc");
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
        //Add ing to shopping list
        controllerList();
    } else if (e.target.matches(".recipe__love, .recipe__love *")) {
        controlLike();
    }
});
