document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // CART SESSION
    // ============================================================

    const CART_STORAGE_KEY = "cartSession";


    const generateSessionId = () => {

        const characters =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        let result = "";

        for (let i = 0; i < 16; i++) {

            result += characters[
                Math.floor(
                    Math.random() * characters.length
                )
            ];
        }

        return result;
    };


    const saveCartSession = (session) => {

        try {

            sessionStorage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify(session)
            );

        } catch (error) {

            console.error(
                "[CART] Failed to save cart session:",
                error
            );
        }
    };


    const getCartSession = () => {

        let session = null;


        try {

            const stored =
                sessionStorage.getItem(
                    CART_STORAGE_KEY
                );

            if (stored) {
                session = JSON.parse(stored);
            }

        } catch (error) {

            console.error(
                "[CART] Failed to read cart session:",
                error
            );
        }


        if (
            !session ||
            typeof session !== "object" ||
            typeof session.sessionId !== "string" ||
            session.sessionId.length !== 16 ||
            !Array.isArray(session.cart)
        ) {

            session = {
                sessionId:
                    generateSessionId(),

                cart: []
            };

            saveCartSession(session);
        }


        return session;
    };


    // ============================================================
    // ELEMENT HELPERS
    // ============================================================

    const getElement = (id) => {
        return document.getElementById(id);
    };


    // ============================================================
    // CART POPUP
    // ============================================================

    const showCartPopup = (
        amount,
        productName
    ) => {

        const cartPopup =
            getElement("cart-popup");

        const cartPopupText =
            getElement("cart-popup-text");


        if (!cartPopup || !cartPopupText) {
            return;
        }


        cartPopupText.textContent =
            `${amount} ${productName} was added to cart.`;


        cartPopup.classList.remove(
            "translate-y-20",
            "opacity-0"
        );

        cartPopup.classList.add(
            "translate-y-0",
            "opacity-100"
        );


        if (window.cartPopupTimeout) {

            clearTimeout(
                window.cartPopupTimeout
            );
        }


        window.cartPopupTimeout =
            setTimeout(() => {

                cartPopup.classList.remove(
                    "translate-y-0",
                    "opacity-100"
                );

                cartPopup.classList.add(
                    "translate-y-20",
                    "opacity-0"
                );

            }, 2500);
    };


    const showCartWarning = (message) => {

        const cartPopup =
            getElement("cart-popup");

        const cartPopupText =
            getElement("cart-popup-text");


        if (!cartPopup || !cartPopupText) {

            console.warn(
                "[CART] Warning:",
                message
            );

            return;
        }


        cartPopupText.textContent =
            message;


        cartPopup.classList.remove(
            "translate-y-20",
            "opacity-0"
        );

        cartPopup.classList.add(
            "translate-y-0",
            "opacity-100"
        );


        if (window.cartPopupTimeout) {

            clearTimeout(
                window.cartPopupTimeout
            );
        }


        window.cartPopupTimeout =
            setTimeout(() => {

                cartPopup.classList.remove(
                    "translate-y-0",
                    "opacity-100"
                );

                cartPopup.classList.add(
                    "translate-y-20",
                    "opacity-0"
                );

            }, 3000);
    };


    // ============================================================
    // FORMAT PRICE
    // ============================================================

    const formatPrice = (price) => {

        return `$${Number(price).toFixed(2)}`;
    };


    // ============================================================
    // CART EDIT STATE
    // ============================================================
    //
    // Stores temporary quantity changes.
    //
    // The actual cart is NOT changed until the user presses
    // "Apply changes".
    //
    // Key = cart item index
    // Value = temporary quantity
    //
    // ============================================================

    const editingItems = new Map();


    // ============================================================
    // RENDER CART
    // ============================================================

    const renderCart = () => {

        const cartItemsContainer =
            getElement("cart-items");

        const cartItemCount =
            getElement("cart-item-count");

        const cartTotal =
            getElement("cart-total");


        // Page does not contain a cart drawer.
        // Nothing to render.

        if (!cartItemsContainer) {
            return;
        }


        const session =
            getCartSession();

        const cart =
            session.cart;


        cartItemsContainer.replaceChildren();


        // ========================================================
        // EMPTY CART
        // ========================================================

        if (cart.length === 0) {

            const empty =
                document.createElement("div");

            empty.className =
                "flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant";


            empty.innerHTML = `
                <span class="material-symbols-outlined text-[48px] mb-sm">
                    shopping_cart
                </span>

                <span class="font-headline-md text-headline-md text-on-surface">
                    Your cart is empty
                </span>

                <span class="text-body-md mt-xs">
                    Add something to your cart to see it here.
                </span>
            `;


            cartItemsContainer.appendChild(
                empty
            );


            if (cartItemCount) {

                cartItemCount.textContent =
                    "0 items";
            }


            if (cartTotal) {

                cartTotal.textContent =
                    "$0.00";
            }


            return;
        }


        // ========================================================
        // CART CONTENT
        // ========================================================

        let itemCount = 0;
        let total = 0;


        cart.forEach((item, index) => {

            const actualAmount =
                Math.max(
                    1,
                    Number(item.amount) || 1
                );


            itemCount +=
                actualAmount;


            total +=
                Number(item.totalPrice) || 0;


            // ----------------------------------------------------
            // ITEM CONTAINER
            // ----------------------------------------------------

            const itemElement =
                document.createElement("div");

            itemElement.className =
                "border border-outline-variant rounded-lg p-sm bg-surface-container-lowest";


            // ----------------------------------------------------
            // TOP ROW
            // ----------------------------------------------------

            const topRow =
                document.createElement("div");

            topRow.className =
                "flex items-start justify-between gap-sm";


            // ----------------------------------------------------
            // PRODUCT NAME
            // ----------------------------------------------------

            const productName =
                document.createElement("div");

            productName.className =
                "font-label-md text-label-md font-semibold text-on-surface flex-1";

            productName.textContent =
                item.product ?? "";


            // ----------------------------------------------------
            // EDIT BUTTON
            // ----------------------------------------------------

            const editButton =
                document.createElement("button");

            editButton.type =
                "button";

            editButton.className =
                "flex items-center justify-center shrink-0 w-8 h-8 rounded-full text-on-surface-variant hover:bg-surface-container-highest transition-colors";

            editButton.title =
                editingItems.has(index)
                    ? "Cancel changes"
                    : "Edit quantity";

            editButton.setAttribute(
                "aria-label",
                editingItems.has(index)
                    ? "Cancel changes"
                    : "Edit quantity"
            );


            const editIcon =
                document.createElement("span");

            editIcon.className =
                "material-symbols-outlined text-[18px]";


            editIcon.textContent =
                editingItems.has(index)
                    ? "close"
                    : "edit";


            editButton.appendChild(
                editIcon
            );


            editButton.addEventListener(
                "click",
                () => {

                    // ------------------------------------------------
                    // CANCEL EDIT
                    // ------------------------------------------------

                    if (
                        editingItems.has(index)
                    ) {

                        editingItems.delete(
                            index
                        );

                        renderCart();

                        return;
                    }


                    // ------------------------------------------------
                    // START EDIT
                    // ------------------------------------------------

                    editingItems.set(
                        index,
                        actualAmount
                    );

                    renderCart();
                }
            );


            topRow.append(
                productName,
                editButton
            );


            // ----------------------------------------------------
            // VARIANTS
            // ----------------------------------------------------

            const variants =
                document.createElement("div");

            variants.className =
                "text-label-sm text-on-surface-variant mt-xs";


            const variantEntries =
                Object.entries(
                    item.variants ?? {}
                );


            if (variantEntries.length > 0) {

                variants.textContent =
                    variantEntries
                        .map(
                            ([key, value]) =>
                                `${key}: ${value}`
                        )
                        .join(" · ");
            }


            // ----------------------------------------------------
            // BOTTOM ROW
            // ----------------------------------------------------

            const bottom =
                document.createElement("div");

            bottom.className =
                "flex items-center justify-between mt-sm";


            // ====================================================
            // NORMAL QUANTITY MODE
            // ====================================================

            if (!editingItems.has(index)) {

                const quantity =
                    document.createElement("span");

                quantity.className =
                    "text-label-sm text-on-surface-variant";

                quantity.textContent =
                    `Qty: ${actualAmount}`;


                bottom.appendChild(
                    quantity
                );

            }

            // ====================================================
            // EDIT QUANTITY MODE
            // ====================================================

            else {

                const editControls =
                    document.createElement("div");

                editControls.className =
                    "flex items-center gap-xs";


                const currentEditingAmount =
                    Math.max(
                        1,
                        Number(
                            editingItems.get(index)
                        ) || 1
                    );


                const maximum =
                    Number.isFinite(
                        Number(item.maxAmount)
                    )
                        ? Math.max(
                            1,
                            Number(item.maxAmount)
                        )
                        : Infinity;


                // ------------------------------------------------
                // DECREASE BUTTON
                // ------------------------------------------------

                const decreaseButton =
                    document.createElement("button");

                decreaseButton.type =
                    "button";

                decreaseButton.className =
                    "flex items-center justify-center w-8 h-8 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container-highest disabled:opacity-40 disabled:pointer-events-none transition-colors";

                decreaseButton.title =
                    "Decrease quantity";

                decreaseButton.setAttribute(
                    "aria-label",
                    "Decrease quantity"
                );

                decreaseButton.innerHTML =
                    `<span class="material-symbols-outlined text-[18px]">remove</span>`;


                decreaseButton.disabled =
                    currentEditingAmount <= 1;


                decreaseButton.addEventListener(
                    "click",
                    () => {

                        const current =
                            Math.max(
                                1,
                                Number(
                                    editingItems.get(index)
                                ) || 1
                            );


                        editingItems.set(
                            index,
                            Math.max(
                                1,
                                current - 1
                            )
                        );


                        renderCart();
                    }
                );


                // ------------------------------------------------
                // QUANTITY DISPLAY
                // ------------------------------------------------

                const quantityDisplay =
                    document.createElement("span");

                quantityDisplay.className =
                    "min-w-[2rem] text-center text-label-md font-semibold text-on-surface";

                quantityDisplay.textContent =
                    String(
                        currentEditingAmount
                    );


                // ------------------------------------------------
                // INCREASE BUTTON
                // ------------------------------------------------

                const increaseButton =
                    document.createElement("button");

                increaseButton.type =
                    "button";

                increaseButton.className =
                    "flex items-center justify-center w-8 h-8 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container-highest disabled:opacity-40 disabled:pointer-events-none transition-colors";

                increaseButton.title =
                    "Increase quantity";

                increaseButton.setAttribute(
                    "aria-label",
                    "Increase quantity"
                );

                increaseButton.innerHTML =
                    `<span class="material-symbols-outlined text-[18px]">add</span>`;


                increaseButton.disabled =
                    Number.isFinite(maximum) &&
                    currentEditingAmount >= maximum;


                increaseButton.addEventListener(
                    "click",
                    () => {

                        const current =
                            Math.max(
                                1,
                                Number(
                                    editingItems.get(index)
                                ) || 1
                            );


                        if (
                            Number.isFinite(maximum) &&
                            current >= maximum
                        ) {

                            showCartWarning(
                                `The maximum amount for ${item.product ?? "this item"} is ${maximum}.`
                            );

                            return;
                        }


                        editingItems.set(
                            index,
                            Number.isFinite(maximum)
                                ? Math.min(
                                    maximum,
                                    current + 1
                                )
                                : current + 1
                        );


                        renderCart();
                    }
                );


                editControls.append(
                    decreaseButton,
                    quantityDisplay,
                    increaseButton
                );


                bottom.appendChild(
                    editControls
                );


                // ------------------------------------------------
                // APPLY BUTTON
                // ------------------------------------------------

                const applyButton =
                    document.createElement("button");

                applyButton.type =
                    "button";

                applyButton.className =
                    "flex items-center gap-xs px-sm py-xs rounded-lg bg-secondary text-on-secondary hover:opacity-90 transition-opacity";

                applyButton.title =
                    "Apply changes";

                applyButton.setAttribute(
                    "aria-label",
                    "Apply changes"
                );


                applyButton.innerHTML = `
                    <span class="material-symbols-outlined text-[18px]">
                        check
                    </span>

                    <span class="text-label-sm">
                        Apply changes
                    </span>
                `;


                applyButton.addEventListener(
                    "click",
                    () => {

                        const newAmount =
                            Math.max(
                                1,
                                Number(
                                    editingItems.get(index)
                                ) || 1
                            );


                        const maximum =
                            Number.isFinite(
                                Number(item.maxAmount)
                            )
                                ? Math.max(
                                    1,
                                    Number(item.maxAmount)
                                )
                                : Infinity;


                        const finalAmount =
                            Number.isFinite(maximum)
                                ? Math.min(
                                    newAmount,
                                    maximum
                                )
                                : newAmount;


                        const oldAmount =
                            Math.max(
                                1,
                                Number(item.amount) || 1
                            );


                        item.amount =
                            finalAmount;


                        const unitPrice =
                            oldAmount > 0
                                ? (
                                    Number(item.totalPrice) /
                                    oldAmount
                                )
                                : 0;


                        item.totalPrice =
                            unitPrice *
                            finalAmount;


                        // Make sure the stored value does not
                        // accidentally exceed the product limit.

                        if (
                            Number.isFinite(maximum) &&
                            item.amount > maximum
                        ) {

                            item.amount =
                                maximum;

                            item.totalPrice =
                                unitPrice *
                                maximum;
                        }


                        saveCartSession(
                            session
                        );


                        editingItems.delete(
                            index
                        );


                        renderCart();


                        console.log(
                            "[CART] Quantity changed:",
                            {
                                productId:
                                    item.productId,

                                oldAmount:
                                    oldAmount,

                                newAmount:
                                    item.amount
                            }
                        );
                    }
                );


                bottom.appendChild(
                    applyButton
                );
            }


            // ----------------------------------------------------
            // PRICE
            // ----------------------------------------------------

            const price =
                document.createElement("span");

            price.className =
                "font-label-md text-label-md font-semibold text-on-surface";

            price.textContent =
                formatPrice(
                    item.totalPrice
                );


            bottom.appendChild(
                price
            );


            // ----------------------------------------------------
            // APPEND ITEM
            // ----------------------------------------------------

            itemElement.append(
                topRow,
                variants,
                bottom
            );


            cartItemsContainer.appendChild(
                itemElement
            );
        });


        // ========================================================
        // TOTALS
        // ========================================================

        if (cartItemCount) {

            cartItemCount.textContent =
                `${itemCount} ${
                    itemCount === 1
                        ? "item"
                        : "items"
                }`;
        }


        if (cartTotal) {

            cartTotal.textContent =
                formatPrice(total);
        }
    };


    // ============================================================
    // OPEN CART
    // ============================================================

    const openCart = () => {

        const cartDrawer =
            getElement("cart-drawer");

        const cartOverlay =
            getElement("cart-overlay");


        renderCart();


        if (cartDrawer) {

            cartDrawer.classList.remove(
                "translate-x-full"
            );
        }


        if (cartOverlay) {

            cartOverlay.classList.remove(
                "opacity-0",
                "pointer-events-none"
            );

            cartOverlay.classList.add(
                "opacity-100"
            );
        }
    };


    // ============================================================
    // CLOSE CART
    // ============================================================

    const closeCart = () => {

        const cartDrawer =
            getElement("cart-drawer");

        const cartOverlay =
            getElement("cart-overlay");


        // Discard all unapplied edits.

        editingItems.clear();


        if (cartDrawer) {

            cartDrawer.classList.add(
                "translate-x-full"
            );
        }


        if (cartOverlay) {

            cartOverlay.classList.remove(
                "opacity-100"
            );

            cartOverlay.classList.add(
                "opacity-0",
                "pointer-events-none"
            );
        }
    };


    // ============================================================
    // ADD TO CART
    // ============================================================

    const addToCart = ({
        productId = "",
        productName = "",
        price = 0,
        amount = 1,
        maxAmount = Infinity,
        variants = {}
    } = {}) => {

        const quantity =
            Math.max(
                1,
                Number(amount) || 1
            );


        const actualPrice =
            Number(price) || 0;


        const maximum =
            Number.isFinite(
                Number(maxAmount)
            )
                ? Math.max(
                    1,
                    Number(maxAmount)
                )
                : Infinity;


        const normalizedProductId =
            String(productId);


        const normalizedVariants =
            variants &&
            typeof variants === "object"
                ? variants
                : {};


        const session =
            getCartSession();


        // ========================================================
        // FIND EXISTING IDENTICAL ITEM
        // ========================================================

        const existingItem =
            session.cart.find((item) => {

                return (
                    String(
                        item.productId ?? ""
                    ) ===
                        normalizedProductId &&

                    JSON.stringify(
                        item.variants ?? {}
                    ) ===
                        JSON.stringify(
                            normalizedVariants
                        )
                );
            });


        // ========================================================
        // EXISTING ITEM
        // ========================================================

        if (existingItem) {

            const currentAmount =
                Math.max(
                    1,
                    Number(
                        existingItem.amount
                    ) || 1
                );


            // Update maxAmount in case the
            // product's limit has changed.

            existingItem.maxAmount =
                maximum;


            // ----------------------------------------------------
            // ALREADY AT MAXIMUM
            // ----------------------------------------------------

            if (
                Number.isFinite(maximum) &&
                currentAmount >= maximum
            ) {

                showCartWarning(
                    `You already have the maximum amount of ${productName || "this item"} in your cart (${maximum}).`
                );


                console.warn(
                    "[CART] Maximum amount already reached:",
                    existingItem
                );


                return null;
            }


            // ----------------------------------------------------
            // WOULD EXCEED MAXIMUM
            // ----------------------------------------------------

            const requestedAmount =
                currentAmount +
                quantity;


            if (
                Number.isFinite(maximum) &&
                requestedAmount > maximum
            ) {

                const remaining =
                    maximum -
                    currentAmount;


                if (remaining > 0) {

                    existingItem.amount =
                        maximum;

                    existingItem.totalPrice =
                        actualPrice *
                        maximum;


                    saveCartSession(
                        session
                    );


                    renderCart();


                    showCartWarning(
                        `Only ${remaining} more ${productName || "item"}${remaining === 1 ? "" : "s"} can be added. The cart limit is ${maximum}.`
                    );


                    console.warn(
                        "[CART] Quantity exceeded maximum. Added remaining amount only.",
                        {
                            productId:
                                normalizedProductId,

                            currentAmount:
                                currentAmount,

                            requestedAmount:
                                requestedAmount,

                            maximum:
                                maximum,

                            added:
                                remaining
                        }
                    );


                    return existingItem;
                }
            }


            // ----------------------------------------------------
            // ADD TO EXISTING QUANTITY
            // ----------------------------------------------------

            existingItem.amount =
                currentAmount +
                quantity;


            existingItem.totalPrice =
                actualPrice *
                existingItem.amount;


            saveCartSession(
                session
            );


            showCartPopup(
                quantity,
                productName || ""
            );


            renderCart();


            console.log(
                "[CART] Existing item quantity increased:",
                existingItem
            );


            return existingItem;
        }


        // ========================================================
        // NEW ITEM
        // ========================================================

        const finalAmount =
            Number.isFinite(maximum)
                ? Math.min(
                    quantity,
                    maximum
                )
                : quantity;


        const cartItem = {

            productId:
                normalizedProductId,

            product:
                String(productName),

            variants:
                normalizedVariants,

            amount:
                finalAmount,

            maxAmount:
                maximum,

            totalPrice:
                actualPrice *
                finalAmount
        };


        session.cart.push(
            cartItem
        );


        saveCartSession(
            session
        );


        // ========================================================
        // NEW ITEM EXCEEDS MAXIMUM
        // ========================================================

        if (
            Number.isFinite(maximum) &&
            quantity > maximum
        ) {

            showCartWarning(
                `Only ${maximum} ${productName || "item"}${maximum === 1 ? "" : "s"} can be added to the cart.`
            );


            console.warn(
                "[CART] New item quantity exceeded maximum:",
                {
                    productId:
                        normalizedProductId,

                    requested:
                        quantity,

                    maximum:
                        maximum
                }
            );

        } else {

            showCartPopup(
                finalAmount,
                productName || ""
            );
        }


        renderCart();


        console.log(
            "[CART] Session:",
            session.sessionId
        );

        console.log(
            "[CART] Added:",
            cartItem
        );


        return cartItem;
    };


    // ============================================================
    // EVENT DELEGATION
    // ============================================================
    //
    // These listeners are attached to document instead of
    // directly to buttons. This allows the cart elements to
    // exist before or after cart.js loads.
    //
    // ============================================================

    document.addEventListener(
        "click",
        (event) => {

            const target =
                event.target.closest(
                    "#shopping-cart-button"
                );


            if (target) {

                event.preventDefault();

                openCart();

                return;
            }


            const closeButton =
                event.target.closest(
                    "#close-cart-button"
                );


            if (closeButton) {

                event.preventDefault();

                closeCart();

                return;
            }


            const overlay =
                event.target.closest(
                    "#cart-overlay"
                );


            if (
                overlay &&
                event.target === overlay
            ) {

                closeCart();

                return;
            }
        }
    );


    // ============================================================
    // INITIALIZE
    // ============================================================

    getCartSession();

    renderCart();


    // ============================================================
    // PUBLIC CART API
    // ============================================================

    window.Cart = {

        getSession:
            getCartSession,

        saveSession:
            saveCartSession,

        add:
            addToCart,

        render:
            renderCart,

        open:
            openCart,

        close:
            closeCart
    };


    console.log(
        "[CART] Cart system initialized."
    );
});