(function () {
    'use strict';

    var RATE_LIMIT_KEY = 'codecommute_last_submission';
    var RATE_LIMIT_MS = 5 * 60 * 1000;
    var MAX_CHARS = 10000;
    var FUNCTION_URL = 'https://codecommutefunctions-drcscgasfhexesgf.centralus-01.azurewebsites.net/api/SubmitContactForm';

    function isRateLimited() {
        var last = localStorage.getItem(RATE_LIMIT_KEY);
        return last ? (Date.now() - parseInt(last, 10)) < RATE_LIMIT_MS : false;
    }

    function getRemaining() {
        var last = parseInt(localStorage.getItem(RATE_LIMIT_KEY), 10);
        var ms = Math.max(0, RATE_LIMIT_MS - (Date.now() - last));
        var secs = Math.ceil(ms / 1000);
        if (secs >= 120) return Math.ceil(secs / 60) + ' minutes';
        if (secs >= 60) return '1 minute';
        return secs + ' second' + (secs !== 1 ? 's' : '');
    }

    function showMessage(isSuccess, text) {
        var el = document.getElementById('submit-message');
        if (!el) return;
        el.textContent = text;
        el.className = 'alert ' + (isSuccess ? 'alert-success' : 'alert-danger');
        el.style.display = 'block';
        el.setAttribute('role', 'alert');
    }

    function hideMessage() {
        var el = document.getElementById('submit-message');
        if (el) el.style.display = 'none';
    }

    function updateButtonState() {
        var btn = document.getElementById('submit-btn');
        var rateLimitMsg = document.getElementById('rate-limit-msg');
        if (!btn) return;

        if (isRateLimited()) {
            btn.disabled = true;
            btn.innerHTML = '<span>Thanks For Your Question!</span>';
            if (rateLimitMsg) {
                rateLimitMsg.style.display = 'block';
                rateLimitMsg.textContent = 'You can submit another question in ' + getRemaining() + '.';
            }
        } else {
            btn.disabled = false;
            btn.innerHTML = '<span>Submit Question</span>';
            if (rateLimitMsg) {
                rateLimitMsg.style.display = 'none';
            }
        }
    }

    function clearValidationErrors() {
        var els = document.querySelectorAll('#contact-form .is-invalid');
        for (var i = 0; i < els.length; i++) {
            els[i].classList.remove('is-invalid');
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        hideMessage();
        clearValidationErrors();

        var btn = document.getElementById('submit-btn');
        if (!btn || btn.disabled) return;

        var isAnonymous = !!(document.getElementById('isAnonymous') || {}).checked;
        var name = ((document.getElementById('name') || {}).value || '').trim();
        var socialPlatform = (document.getElementById('socialPlatform') || {}).value || '';
        var socialHandle = ((document.getElementById('socialHandle') || {}).value || '').trim();
        var questionEl = document.getElementById('question');
        var question = ((questionEl || {}).value || '').trim();

        var hasError = false;

        if (!isAnonymous && !name) {
            var nameEl = document.getElementById('name');
            if (nameEl) nameEl.classList.add('is-invalid');
            showMessage(false, 'Name is required when not submitting anonymously.');
            hasError = true;
        }

        if (!question) {
            if (questionEl) questionEl.classList.add('is-invalid');
            if (!hasError) showMessage(false, 'Question is required.');
            hasError = true;
        } else if (question.length > MAX_CHARS) {
            if (questionEl) questionEl.classList.add('is-invalid');
            if (!hasError) showMessage(false, 'Question cannot exceed 10,000 characters.');
            hasError = true;
        }

        if (hasError) return;

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span><span>Sending...</span>';

        var payload = JSON.stringify({
            isAnonymous: isAnonymous,
            name: isAnonymous ? null : name,
            socialPlatform: socialPlatform || null,
            socialHandle: socialHandle || null,
            question: question
        });

        fetch(FUNCTION_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        }).then(function (response) {
            if (response.ok) {
                showMessage(true, "Thank you! Your question has been submitted successfully. Make sure you're subscribed on YouTube!");
                localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
                e.target.reset();
                clearValidationErrors();
                var nameFields = document.getElementById('name-fields');
                if (nameFields) nameFields.style.display = '';
                var charCounter = document.getElementById('char-counter');
                if (charCounter) charCounter.textContent = 'Maximum 10,000 characters. Current: 0/10,000';
            } else if (response.status === 429) {
                showMessage(false, 'Your question was already submitted -- come back tomorrow!');
            } else {
                showMessage(false, 'Sorry, there was an error submitting your question. Please try again later.');
            }
        }).catch(function () {
            showMessage(false, 'Sorry, there was an error submitting your question. Please try again later.');
        }).finally(function () {
            updateButtonState();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var anonCheckbox = document.getElementById('isAnonymous');
        var nameFields = document.getElementById('name-fields');
        if (anonCheckbox && nameFields) {
            anonCheckbox.addEventListener('change', function () {
                nameFields.style.display = this.checked ? 'none' : '';
            });
        }

        var questionEl = document.getElementById('question');
        var charCounter = document.getElementById('char-counter');
        if (questionEl && charCounter) {
            questionEl.addEventListener('input', function () {
                charCounter.textContent = 'Maximum 10,000 characters. Current: ' + this.value.length + '/10,000';
            });
        }

        updateButtonState();
        setInterval(updateButtonState, 1000);

        var form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
    });
})();
