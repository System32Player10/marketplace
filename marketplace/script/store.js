document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);

    const mainBody = document.getElementById("body-main");
    const errorBody = document.getElementById("body-error");

    const showError = () => {
        if (mainBody) mainBody.style.display = "none";
        if (errorBody) errorBody.style.display = "block";
    };

    if (!window.location.search) {
        window.location.href = "../";
        return;
    }

    const id = params.get("id");

    if (!id) {
        console.error("No 'id' parameter found.");
        showError();
        return;
    }

    try {
        const response = await fetch("../data.json");

        if (!response.ok) {
            console.error(`Failed to fetch data.json. HTTP status: ${response.status}`);
            showError();
            return;
        }

        const data = await response.json();
        if (!data.stores) {
            console.error("data.json does not contain a 'stores' object.");
            showError();
            return;
        }

        const exists = Object.hasOwn(data.stores, id);
        if (!exists) {
            console.error(`Store ID "${id}" was not found.`);
            showError();
            return;
        }


        const store = data.stores[id];
        const storeName = document.getElementById("store-name");

        if (storeName) storeName.textContent = store.name ?? "";

        const storeSearch = document.getElementById("store-search");
        if (storeSearch) storeSearch.placeholder = `Search in ${store.name ?? "Store"}...`;


        const storeLogo = document.getElementById("store-logo");
        if (storeLogo) {
            if (storeLogo.tagName === "IMG") storeLogo.src = store["logo-href"] ?? "";
            else storeLogo.href = store["logo-href"] ?? "#";
        }


        const storeBanner = document.getElementById("store-banner");
        if (storeBanner && store["banner-href"]) storeBanner.style.backgroundImage = `url("${store["banner-href"]}")`;

        const storeAbout =document.getElementById("store-about");
        if (storeAbout) storeAbout.textContent = store.about ?? "";

        const contact = store.contact ?? {};

        const storeAddress =document.getElementById("store-address");
        if (storeAddress) storeAddress.textContent = contact.address ?? "";

        const supportMail = document.getElementById("support-mail");

        if (supportMail) {
            supportMail.textContent = contact["support-mail"] ?? "";
            if (contact["support-mail"]) supportMail.href = `mailto:${contact["support-mail"]}`;
        }

        const storeSite = document.getElementById("store-site");

        if (storeSite) {
            storeSite.textContent = contact.website ?? "";
            if (contact.website) storeSite.href = `https://${contact.website}`;
        }


        const joinDate = document.getElementById("join-date");
        if (joinDate) joinDate.textContent = store["join-date"] ?? "";

        const preferences = store.preferences ?? {};

        const followers = preferences.followers;

        const storeFollowers = document.getElementById("store-followers");

        if (storeFollowers && Array.isArray(followers) && followers.length >= 1) {
            const number = followers[0];
            const suffix = followers[1] ?? "";

            storeFollowers.textContent = `${number}${suffix}`;
        }

        const positiveFeedback = preferences["positive-feedback"];
        const positiveFeedbackElement = document.getElementById("positive-feedbacks");

        if (positiveFeedbackElement &&positiveFeedback !== undefined && positiveFeedback !== null) positiveFeedbackElement.textContent = `${positiveFeedback}%`;

        const rating = preferences.rating;
        const reviews = preferences.reviews;
        const storeReviews = document.getElementById("store-reviews");

        if (storeReviews && rating !== undefined && rating !== null && Array.isArray(reviews) && reviews.length >= 1) {
            const reviewNumber = reviews[0];
            const reviewSuffix = reviews[1] ?? "";

            storeReviews.textContent = `${rating}/5.0 rating (${reviewNumber}${reviewSuffix} reviews)`;
        }
    } catch (error) {
        console.error("Error:", error);
        showError();
    }
});