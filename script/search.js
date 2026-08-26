document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // CONFIGURATION
    // ============================================================

    const DATA_URL = "../data.json";
    const PRODUCTS_PER_PAGE = 15;

    let catalog = {};
    let allProducts = [];
    let filteredProducts = [];

    let currentPage = 1;

    let currentQuery = "";
    let currentBrand = "";
    let currentMinPrice = null;
    let currentMaxPrice = null;
    let currentRating = null;
    let currentSort = "relevance";


    // ============================================================
    // GLOBAL SEARCH BAR
    // ============================================================

    const searchInputs = document.querySelectorAll(
        'input[placeholder="Search for products, brands and more"]'
    );

    searchInputs.forEach((searchInput) => {

        searchInput.addEventListener("keydown", (event) => {

            if (event.key !== "Enter") {
                return;
            }

            const query = searchInput.value.trim();

            if (!query) {
                return;
            }

            window.location.href =
                `/marketplace/search/?search=${encodeURIComponent(query)}`;
        });

    });


    // ============================================================
    // SEARCH PAGE CHECK
    // ============================================================

    const currentPath = window.location.pathname.replace(/\/+$/, "");

    if (currentPath !== "/marketplace/search") {
        return;
    }


    // ============================================================
    // DOM ELEMENTS
    // ============================================================

    const params = new URLSearchParams(window.location.search);

    const searchQuery = params.get("search") || "";

    const searchPageInput = document.querySelector(
        'input[placeholder="Search for products, brands and more"]'
    );

    const resultHeading =
        document.getElementById("search-results-title");

    const resultCount =
        document.getElementById("search-results-count");

    const productGrid =
        document.getElementById("product-grid");

    const emptyState =
        document.getElementById("search-empty-state");

    const searchResults =
        document.getElementById("search-results");

    const brandInput =
        document.getElementById("filter-brand");

    const minPriceInput =
        document.getElementById("filter-price-min");

    const maxPriceInput =
        document.getElementById("filter-price-max");

    const ratingInputs =
        document.querySelectorAll(".rating-filter");

    const sortSelect =
        document.getElementById("sort-products");

    const clearFiltersButton =
        document.getElementById("clear-filters");


    // ============================================================
    // EMPTY SEARCH
    // ============================================================

    if (!searchQuery.trim()) {

        if (searchResults) {
            searchResults.style.display = "none";
        }

        if (emptyState) {
            emptyState.classList.remove("hidden");
            emptyState.classList.add("flex");
        }

        return;
    }


    // ============================================================
    // SEARCH QUERY
    // ============================================================

    currentQuery = searchQuery.trim();

    if (searchPageInput) {
        searchPageInput.value = currentQuery;
    }

    document.title =
        `Search results for "${currentQuery}" - MarketPlace`;

    if (resultHeading) {
        resultHeading.textContent =
            `Results for "${currentQuery}"`;
    }


    // ============================================================
    // LOAD DATA.JSON
    // ============================================================

    async function loadCatalog() {

        try {

            const response = await fetch(DATA_URL, {
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to load ${DATA_URL} (${response.status})`
                );
            }

            const data = await response.json();

            /*
             * data.json structure:
             *
             * {
             *     "catalogs": {
             *         "product-id": {
             *             ...
             *         }
             *     }
             * }
             */

            catalog = data.catalogs || {};

            allProducts = Object.entries(catalog).map(
                ([id, product]) => ({
                    id,
                    product
                })
            );

            console.log(
                `Loaded ${allProducts.length} products from ../data.json`
            );

            applyFilters();

        } catch (error) {

            console.error(
                "MarketPlace search: failed to load data.json",
                error
            );

            if (productGrid) {

                productGrid.innerHTML = `
                    <div class="col-span-full py-xl text-center">

                        <span
                            class="material-symbols-outlined text-[64px] text-error opacity-70"
                        >
                            error
                        </span>

                        <h2
                            class="font-headline-md text-headline-md font-semibold text-on-surface mt-4"
                        >
                            Failed to load product data
                        </h2>

                        <p
                            class="font-body-md text-body-md text-on-surface-variant mt-2"
                        >
                            Please check that ../data.json is available.
                        </p>

                    </div>
                `;

            }

        }

    }


    // ============================================================
    // TEXT NORMALIZATION
    // ============================================================

    function normalizeText(value) {

        return String(value ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

    }


    // ============================================================
    // LEVENSHTEIN DISTANCE
    //
    // Used for typo-tolerant searching.
    //
    // Example:
    //
    // retrp
    // retro
    //
    // Distance = 1
    // ============================================================

    function levenshtein(a, b) {

        a = String(a);
        b = String(b);

        if (a === b) {
            return 0;
        }

        if (!a.length) {
            return b.length;
        }

        if (!b.length) {
            return a.length;
        }

        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {

            for (let j = 1; j <= a.length; j++) {

                if (b.charAt(i - 1) === a.charAt(j - 1)) {

                    matrix[i][j] =
                        matrix[i - 1][j - 1];

                } else {

                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );

                }

            }

        }

        return matrix[b.length][a.length];

    }


    // ============================================================
    // FUZZY WORD MATCH
    // ============================================================

    function fuzzyWordScore(queryWord, textWord) {

        if (!queryWord || !textWord) {
            return 0;
        }

        if (queryWord === textWord) {
            return 1;
        }

        /*
         * Direct partial match.
         *
         * Example:
         * "pavil" -> "pavilion"
         */

        if (
            textWord.includes(queryWord) ||
            queryWord.includes(textWord)
        ) {

            const difference =
                Math.abs(queryWord.length - textWord.length);

            return Math.max(
                0.75,
                1 - difference / Math.max(
                    queryWord.length,
                    textWord.length
                )
            );

        }


        const distance =
            levenshtein(queryWord, textWord);

        const longest =
            Math.max(queryWord.length, textWord.length);

        if (longest === 0) {
            return 0;
        }

        const similarity =
            1 - distance / longest;


        /*
         * Typo tolerance.
         *
         * Longer words can tolerate more errors.
         *
         * retrp -> retro
         * distance = 1
         * similarity = 0.8
         */

        if (
            queryWord.length >= 5 &&
            similarity >= 0.70
        ) {
            return similarity * 0.9;
        }

        if (
            queryWord.length >= 4 &&
            similarity >= 0.75
        ) {
            return similarity * 0.85;
        }

        return 0;

    }


    // ============================================================
    // FUZZY FIELD SCORE
    // ============================================================

    function fuzzyFieldScore(query, text) {

        const normalizedQuery =
            normalizeText(query);

        const normalizedText =
            normalizeText(text);

        if (!normalizedQuery || !normalizedText) {
            return 0;
        }


        /*
         * Exact complete phrase.
         */

        if (normalizedText === normalizedQuery) {
            return 1;
        }


        /*
         * Exact substring.
         */

        if (normalizedText.includes(normalizedQuery)) {
            return 0.95;
        }


        const queryWords =
            normalizedQuery.split(/\s+/);

        const textWords =
            normalizedText.split(/\s+/);


        let totalScore = 0;
        let matchedWords = 0;


        for (const queryWord of queryWords) {

            let bestScore = 0;

            for (const textWord of textWords) {

                const score =
                    fuzzyWordScore(
                        queryWord,
                        textWord
                    );

                if (score > bestScore) {
                    bestScore = score;
                }

            }

            if (bestScore > 0) {

                totalScore += bestScore;
                matchedWords++;

            }

        }


        if (matchedWords === 0) {
            return 0;
        }


        /*
         * Every query word should ideally match.
         */

        const wordCoverage =
            matchedWords / queryWords.length;

        return (
            (totalScore / queryWords.length) *
            wordCoverage
        );

    }


    // ============================================================
    // CREATE SEARCHABLE PRODUCT TEXT
    // ============================================================

    function getProductSearchData(product) {

        const name =
            product.name || "";

        const description =
            product.description || "";

        let brand = "";

        if (Array.isArray(product.brand)) {
            brand = product.brand[0] || "";
        } else {
            brand = product.brand || "";
        }


        /*
         * Specifications are arrays such as:
         *
         * ["Processor", "Intel Core i5"]
         */

        let specifications = "";

        if (Array.isArray(product.specification)) {

            specifications =
                product.specification
                    .flat()
                    .join(" ");

        }


        /*
         * Variants can also contain searchable information.
         */

        let variants = "";

        if (product.variants) {

            try {

                variants =
                    JSON.stringify(product.variants);

            } catch {
                variants = "";
            }

        }


        return {
            name,
            brand,
            description,
            specifications,
            variants
        };

    }


    // ============================================================
    // PRODUCT RELEVANCE SCORE
    // ============================================================

    function getRelevanceScore(product, query) {

        const fields =
            getProductSearchData(product);


        /*
         * Name gets the highest priority.
         */

        const nameScore =
            fuzzyFieldScore(
                query,
                fields.name
            );

        const brandScore =
            fuzzyFieldScore(
                query,
                fields.brand
            );

        const descriptionScore =
            fuzzyFieldScore(
                query,
                fields.description
            );

        const specificationScore =
            fuzzyFieldScore(
                query,
                fields.specifications
            );

        const variantScore =
            fuzzyFieldScore(
                query,
                fields.variants
            );


        /*
         * Strong preference for:
         *
         * 1. Exact product name
         * 2. Product-name partial match
         * 3. Brand
         * 4. Description
         * 5. Specifications
         */

        let score = 0;

        score += nameScore * 100;
        score += brandScore * 50;
        score += descriptionScore * 20;
        score += specificationScore * 10;
        score += variantScore * 5;


        /*
         * Bonus when the entire query appears
         * in the product name.
         */

        const normalizedQuery =
            normalizeText(query);

        const normalizedName =
            normalizeText(fields.name);

        if (
            normalizedQuery &&
            normalizedName.includes(normalizedQuery)
        ) {
            score += 100;
        }


        return score;

    }


    // ============================================================
    // GET PRODUCT PRICE
    // ============================================================

    function getProductPrice(product) {

        if (
            product.price &&
            typeof product.price.real === "number"
        ) {
            return product.price.real;
        }

        return 0;

    }


    // ============================================================
    // GET PRODUCT RATING
    // ============================================================

    function getProductRating(product) {

        if (
            product.preferences &&
            typeof product.preferences.rating === "number"
        ) {
            return product.preferences.rating;
        }

        return 0;

    }


    // ============================================================
    // BRAND MATCH
    // ============================================================

    function matchesBrand(product, brandQuery) {

        if (!brandQuery.trim()) {
            return true;
        }

        let brand = "";

        if (Array.isArray(product.brand)) {
            brand = product.brand[0] || "";
        } else {
            brand = product.brand || "";
        }

        return fuzzyFieldScore(
            brandQuery,
            brand
        ) >= 0.45;

    }


    // ============================================================
    // APPLY ALL FILTERS
    // ============================================================

    function applyFilters() {

        currentQuery =
            searchQuery.trim();

        currentBrand =
            brandInput
                ? brandInput.value.trim()
                : "";

        currentMinPrice =
            minPriceInput &&
            minPriceInput.value !== ""
                ? Number(minPriceInput.value)
                : null;

        currentMaxPrice =
            maxPriceInput &&
            maxPriceInput.value !== ""
                ? Number(maxPriceInput.value)
                : null;

        currentRating = null;

        ratingInputs.forEach((input) => {

            if (input.checked) {
                currentRating =
                    Number(input.value);
            }

        });

        currentSort =
            sortSelect
                ? sortSelect.value
                : "relevance";


        /*
         * First perform the actual search.
         */

        const searchedProducts =
            allProducts
                .map(({ id, product }) => {

                    const relevance =
                        getRelevanceScore(
                            product,
                            currentQuery
                        );

                    return {
                        id,
                        product,
                        relevance
                    };

                })
                /*
                 * A product must have a meaningful
                 * relevance score.
                 */
                .filter((item) =>
                    item.relevance >= 20
                );


        /*
         * Then apply filters.
         */

        filteredProducts =
            searchedProducts.filter(
                ({ product }) => {

                    const price =
                        getProductPrice(product);

                    const rating =
                        getProductRating(product);


                    // ----------------------------
                    // Brand
                    // ----------------------------

                    if (
                        !matchesBrand(
                            product,
                            currentBrand
                        )
                    ) {
                        return false;
                    }


                    // ----------------------------
                    // Minimum price
                    // ----------------------------

                    if (
                        currentMinPrice !== null &&
                        price < currentMinPrice
                    ) {
                        return false;
                    }


                    // ----------------------------
                    // Maximum price
                    // ----------------------------

                    if (
                        currentMaxPrice !== null &&
                        price > currentMaxPrice
                    ) {
                        return false;
                    }


                    // ----------------------------
                    // Rating
                    // ----------------------------

                    if (
                        currentRating !== null &&
                        rating < currentRating
                    ) {
                        return false;
                    }


                    return true;

                }
            );


        // ========================================================
        // SORTING
        // ========================================================

        if (currentSort === "relevance") {

            filteredProducts.sort(
                (a, b) =>
                    b.relevance - a.relevance
            );

        } else if (currentSort === "price-asc") {

            filteredProducts.sort(
                (a, b) =>
                    getProductPrice(a.product) -
                    getProductPrice(b.product)
            );

        } else if (currentSort === "price-desc") {

            filteredProducts.sort(
                (a, b) =>
                    getProductPrice(b.product) -
                    getProductPrice(a.product)
            );

        } else if (currentSort === "newest") {

            /*
             * If your data.json later gets a
             * "created-at" or similar field,
             * this can be changed to use it.
             *
             * For now, preserve catalog order.
             */

            filteredProducts.sort(
                (a, b) => 0
            );

        }


        currentPage = 1;

        renderProducts();

    }


    // ============================================================
    // ESCAPE HTML
    // ============================================================

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    // ============================================================
    // FORMAT PRICE
    // ============================================================

    function formatPrice(price) {

        return new Intl.NumberFormat(
            "en-US",
            {
                style: "currency",
                currency: "USD"
            }
        ).format(price);

    }


    // ============================================================
    // GET PRODUCT IMAGE
    // ============================================================

    function getProductImage(product) {

        if (
            Array.isArray(product["product-href"]) &&
            product["product-href"].length > 0
        ) {

            const image =
                product["product-href"].find(
                    (href) =>
                        typeof href === "string" &&
                        href.trim() !== ""
                );

            if (image) {
                return image;
            }

        }

        return "";

    }

    
    // ============================================================
    // CREATE PRODUCT CARD
    // ============================================================

    function createProductCard(id, product) {

        const card =
            document.createElement("div");

        card.className =
            "group bg-surface-container-lowest border border-outline-variant rounded-DEFAULT overflow-hidden hover-level-2 cursor-pointer flex flex-col h-full";


        const image =
            getProductImage(product);


        let brand = "";

        if (Array.isArray(product.brand)) {
            brand = product.brand[0] || "";
        } else {
            brand = product.brand || "";
        }


        const rating =
            getProductRating(product);

        const price =
            getProductPrice(product);


        const imageHTML =
            image
                ? `
                    <img
                        alt="${escapeHTML(product.name || "Product Image")}"
                        class="w-full h-full object-contain mix-blend-multiply p-4"
                        src="${escapeHTML(image)}"
                    />
                `
                : `
                    <div class="w-full h-full flex items-center justify-center">
                        <span
                            class="material-symbols-outlined text-[64px] text-on-surface-variant opacity-40"
                        >
                            image
                        </span>
                    </div>
                `;


        const ratingHTML =
            rating > 0
                ? `
                    <div class="flex items-center text-on-surface-variant">

                        <span
                            class="material-symbols-outlined text-[14px] text-secondary mr-1"
                            style="font-variation-settings: 'FILL' 1;"
                        >
                            star
                        </span>

                        <span class="font-label-sm text-label-sm">
                            ${escapeHTML(rating)}
                        </span>

                    </div>
                `
                : "";


        card.innerHTML = `

            <div
                class="relative aspect-[4/3] bg-surface-container overflow-hidden"
            >

                ${imageHTML}

            </div>


            <div class="p-4 flex flex-col flex-1">

                <div class="flex justify-between items-start mb-1">

                    <span
                        class="font-label-sm text-label-sm text-on-primary-container bg-surface-container px-2 py-0.5 rounded-DEFAULT"
                    >
                        ${escapeHTML(brand)}
                    </span>

                    ${ratingHTML}

                </div>


                <h3
                    class="font-body-lg text-body-lg text-on-surface font-semibold mb-2 line-clamp-2"
                >
                    ${escapeHTML(product.name || "Unnamed Product")}
                </h3>


                <div class="mt-auto pt-4 flex items-center justify-between">

                    <span
                        class="font-headline-md text-headline-md font-bold text-on-surface"
                    >
                        ${formatPrice(price)}
                    </span>


                    <button
                        type="button"
                        class="bg-primary-container text-on-primary hover:bg-inverse-surface px-4 py-2 rounded-DEFAULT font-label-md text-label-md transition-colors flex items-center gap-2"
                        onclick="window.location.href = '../product/?productId=${id}';"
                    >

                    <span class="material-symbols-outlined text-[18px]">
                        open_in_new
                    </span>

                        View

                    </button>

                </div>

            </div>

        `;


        /*
         * Clicking the card can later be connected
         * to the product page using its catalog ID.
         */

        card.dataset.productId = id;


        return card;

    }


    // ============================================================
    // RENDER PRODUCTS
    // ============================================================

    function renderProducts() {

        if (!productGrid) {
            console.error(
                "Search page: #product-grid was not found."
            );
            return;
        }


        productGrid.innerHTML = "";


        const totalItems =
            filteredProducts.length;


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalItems /
                    PRODUCTS_PER_PAGE
                )
            );


        if (currentPage > totalPages) {
            currentPage = totalPages;
        }


        const startIndex =
            (currentPage - 1) *
            PRODUCTS_PER_PAGE;


        const endIndex =
            Math.min(
                startIndex +
                    PRODUCTS_PER_PAGE,
                totalItems
            );


        const pageProducts =
            filteredProducts.slice(
                startIndex,
                endIndex
            );


        // ========================================================
        // EMPTY RESULTS
        // ========================================================

        if (totalItems === 0) {

            productGrid.innerHTML = `

                <div class="col-span-full py-xl text-center">

                    <span
                        class="material-symbols-outlined text-[72px] text-on-surface-variant opacity-40"
                    >
                        search_off
                    </span>

                    <h2
                        class="font-headline-md text-headline-md font-semibold text-on-surface mt-4"
                    >
                        No products found
                    </h2>

                    <p
                        class="font-body-md text-body-md text-on-surface-variant mt-2"
                    >
                        Try changing your search query or filters.
                    </p>

                </div>

            `;

            updateResultCount(
                0,
                0,
                0
            );

            renderPagination(0);

            return;

        }


        // ========================================================
        // CREATE CARDS
        // ========================================================

        pageProducts.forEach(
            ({ id, product }) => {

                const card =
                    createProductCard(
                        id,
                        product
                    );

                productGrid.appendChild(card);

            }
        );


        // ========================================================
        // UPDATE RESULT COUNT
        // ========================================================

        updateResultCount(
            startIndex + 1,
            endIndex,
            totalItems
        );


        // ========================================================
        // PAGINATION
        // ========================================================

        renderPagination(totalPages);

    }


    // ============================================================
    // RESULT COUNT
    // ============================================================

    function updateResultCount(
        start,
        end,
        total
    ) {

        if (!resultCount) {
            return;
        }


        if (total === 0) {

            resultCount.textContent =
                "Showing 0 items from 0 items";

            return;

        }


        resultCount.textContent =
            `Showing ${start}-${end} items from ${total} items`;

    }


    // ============================================================
    // PAGINATION
    // ============================================================

    function renderPagination(totalPages) {

        /*
         * Remove the old pagination.
         */

        const oldPagination =
            document.getElementById(
                "search-pagination"
            );

        if (oldPagination) {
            oldPagination.remove();
        }


        /*
         * Locate the product grid's parent.
         */

        if (!productGrid) {
            return;
        }


        const pagination =
            document.createElement("div");

        pagination.id =
            "search-pagination";

        pagination.className =
            "mt-xl flex justify-center items-center gap-2 border-t border-outline-variant/30 pt-lg";


        /*
         * No pagination needed for zero results
         * or only one page.
         */

        if (
            totalPages <= 1
        ) {

            /*
             * Still keep the pagination container
             * out of the way.
             */

            return;

        }


        // ========================================================
        // PREVIOUS
        // ========================================================

        const previousButton =
            document.createElement("button");

        previousButton.className =
            "w-10 h-10 flex items-center justify-center rounded-DEFAULT border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

        previousButton.disabled =
            currentPage === 1;

        previousButton.innerHTML = `
            <span class="material-symbols-outlined text-[20px]">
                chevron_left
            </span>
        `;

        previousButton.addEventListener(
            "click",
            () => {

                if (currentPage > 1) {

                    currentPage--;

                    renderProducts();

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }

            }
        );

        pagination.appendChild(
            previousButton
        );


        // ========================================================
        // PAGE NUMBERS
        // ========================================================

        const pages =
            getPaginationPages(
                currentPage,
                totalPages
            );


        pages.forEach((page) => {

            if (page === "...") {

                const separator =
                    document.createElement("span");

                separator.className =
                    "text-on-surface-variant px-2";

                separator.textContent =
                    "...";

                pagination.appendChild(
                    separator
                );

                return;

            }


            const button =
                document.createElement("button");

            button.className =
                "w-10 h-10 flex items-center justify-center rounded-DEFAULT border font-label-md text-label-md transition-colors";


            if (page === currentPage) {

                button.classList.add(
                    "border-secondary",
                    "bg-secondary",
                    "text-on-secondary",
                    "font-bold"
                );

            } else {

                button.classList.add(
                    "border-outline-variant",
                    "text-on-surface-variant",
                    "hover:border-secondary",
                    "hover:text-secondary"
                );

            }


            button.textContent =
                page;


            button.addEventListener(
                "click",
                () => {

                    currentPage =
                        page;

                    renderProducts();

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );


            pagination.appendChild(
                button
            );

        });


        // ========================================================
        // NEXT
        // ========================================================

        const nextButton =
            document.createElement("button");

        nextButton.className =
            "w-10 h-10 flex items-center justify-center rounded-DEFAULT border border-outline-variant text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors";

        nextButton.disabled =
            currentPage === totalPages;

        nextButton.innerHTML = `
            <span class="material-symbols-outlined text-[20px]">
                chevron_right
            </span>
        `;

        nextButton.addEventListener(
            "click",
            () => {

                if (
                    currentPage <
                    totalPages
                ) {

                    currentPage++;

                    renderProducts();

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }

            }
        );

        pagination.appendChild(
            nextButton
        );


        /*
         * Insert pagination after the grid.
         */

        productGrid.parentNode.appendChild(
            pagination
        );

    }


    // ============================================================
    // PAGINATION PAGE CALCULATOR
    // ============================================================

    function getPaginationPages(
        current,
        total
    ) {

        const pages = [];


        if (total <= 7) {

            for (
                let i = 1;
                i <= total;
                i++
            ) {
                pages.push(i);
            }

            return pages;

        }


        pages.push(1);


        if (current > 4) {
            pages.push("...");
        }


        const start =
            Math.max(
                2,
                current - 1
            );

        const end =
            Math.min(
                total - 1,
                current + 1
            );


        for (
            let i = start;
            i <= end;
            i++
        ) {

            pages.push(i);

        }


        if (current < total - 3) {
            pages.push("...");
        }


        pages.push(total);


        return pages;

    }


    // ============================================================
    // FILTER EVENT LISTENERS
    // ============================================================

    if (brandInput) {

        brandInput.addEventListener(
            "input",
            debounce(
                () => {

                    applyFilters();

                },
                250
            )
        );

    }


    if (minPriceInput) {

        minPriceInput.addEventListener(
            "input",
            debounce(
                () => {

                    applyFilters();

                },
                250
            )
        );

    }


    if (maxPriceInput) {

        maxPriceInput.addEventListener(
            "input",
            debounce(
                () => {

                    applyFilters();

                },
                250
            )
        );

    }


    ratingInputs.forEach(
        (input) => {

            input.addEventListener(
                "change",
                () => {

                    applyFilters();

                }
            );

        }
    );


    if (sortSelect) {

        sortSelect.addEventListener(
            "change",
            () => {

                applyFilters();

            }
        );

    }


    // ============================================================
    // CLEAR FILTERS
    // ============================================================

    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            () => {

                if (brandInput) {
                    brandInput.value = "";
                }

                if (minPriceInput) {
                    minPriceInput.value = "";
                }

                if (maxPriceInput) {
                    maxPriceInput.value = "";
                }

                ratingInputs.forEach(
                    (input) => {
                        input.checked = false;
                    }
                );

                if (sortSelect) {
                    sortSelect.value =
                        "relevance";
                }

                currentPage = 1;

                applyFilters();

            }
        );

    }


    // ============================================================
    // DEBOUNCE
    // ============================================================

    function debounce(
        callback,
        delay
    ) {

        let timeout;

        return (...args) => {

            clearTimeout(timeout);

            timeout =
                setTimeout(
                    () => {
                        callback(...args);
                    },
                    delay
                );

        };

    }


    // ============================================================
    // START
    // ============================================================

    loadCatalog();

});