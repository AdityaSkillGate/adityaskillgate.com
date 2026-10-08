/**
 * ============================================================
 * ADITYA SKILL GATE IT SOLUTION — SEARCH PERFORMANCE & ANALYTICS
 * js/analytics.js — GA4 & Search Console Event Tracking
 * ============================================================
 * 
 * Automatically tracks high-intent interactions:
 * - Contact Form Submissions (generate_lead)
 * - Software Demo Requests (demo_request)
 * - Course Enquiries (course_enquiry)
 * - WhatsApp Inquiries (whatsapp_click)
 * - Phone Inbound Calls (phone_call_click)
 * - Job / Resume Submissions (job_application)
 */

(function () {
  'use strict';

  // 1. Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  // 2. Track Event Helper
  window.asgTrackEvent = function (eventName, eventParams) {
    eventParams = eventParams || {};
    eventParams.page_path = window.location.pathname;
    eventParams.page_title = document.title;
    eventParams.timestamp = new Date().toISOString();

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventParams);
    }

    // Also dispatch custom DOM event for local integrations
    window.dispatchEvent(new CustomEvent('asg_analytics_event', {
      detail: { eventName, eventParams }
    }));

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log(`[ASG Analytics] ${eventName}:`, eventParams);
    }
  };

  // 3. Automated Event Listeners
  document.addEventListener('DOMContentLoaded', function () {
    // A. WhatsApp Clicks
    document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(function (el) {
      el.addEventListener('click', function () {
        window.asgTrackEvent('whatsapp_click', {
          link_url: el.href,
          cta_text: el.innerText.trim() || 'WhatsApp CTA'
        });
      });
    });

    // B. Direct Phone Call Clicks
    document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
      el.addEventListener('click', function () {
        window.asgTrackEvent('phone_call_click', {
          phone_number: el.href.replace('tel:', ''),
          cta_text: el.innerText.trim() || 'Call CTA'
        });
      });
    });

    // C. Software Demo Request Clicks
    document.querySelectorAll('a[href*="#demo"], .btn-demo, a[href*="contact.html?service=billing"]').forEach(function (el) {
      el.addEventListener('click', function () {
        window.asgTrackEvent('demo_request_click', {
          target: el.getAttribute('href'),
          cta_text: el.innerText.trim() || 'Request Demo'
        });
      });
    });

    // D. Course Enrollment / Syllabus Downloads
    document.querySelectorAll('.btn-enroll, a[href*="courses.html"], .btn-syllabus').forEach(function (el) {
      el.addEventListener('click', function () {
        window.asgTrackEvent('course_cta_click', {
          target: el.getAttribute('href'),
          cta_text: el.innerText.trim() || 'Course CTA'
        });
      });
    });

    // E. Form Submissions Interceptor (for Lead Generation)
    var contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', function () {
        var subjectInput = contactForm.querySelector('[name="subject"]');
        var subjectVal = subjectInput ? subjectInput.value : 'General Enquiry';
        window.asgTrackEvent('generate_lead', {
          form_id: 'contact_form',
          lead_type: subjectVal,
          lead_category: 'contact'
        });
      });
    }

    var resumeForm = document.getElementById('resume-form') || document.querySelector('.resume-form');
    if (resumeForm) {
      resumeForm.addEventListener('submit', function () {
        window.asgTrackEvent('job_application', {
          form_id: 'resume_upload_form',
          lead_category: 'career'
        });
      });
    }
  });
})();
