// ===================== Worker Progress Report - form logic =====================

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('progressForm');
  const certifyCheck = document.getElementById('certifyCheck');
  const certifyError = document.getElementById('certifyError');
  const submittedStamp = document.getElementById('submittedStamp');
  const claimNoInput = document.getElementById('claimNoInput');

  // ---------------------------------------------------------------
  // 3-page form navigation (matches the PDF's Page 1 / 2 / 3 split)
  // ---------------------------------------------------------------
  const formPages = [
    document.getElementById('formPage1'),
    document.getElementById('formPage2'),
    document.getElementById('formPage3')
  ];
  const currentPageNum = document.getElementById('currentPageNum');
  let activePage = 1;

  function showPage(pageNum) {
    formPages.forEach(function (pageEl, idx) {
      pageEl.style.display = (idx + 1 === pageNum) ? 'block' : 'none';
    });
    activePage = pageNum;
    currentPageNum.textContent = pageNum;
    window.scrollTo(0, 0);
  }

  form.querySelectorAll('.next-page-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      // Validate only the fields on the current page before advancing
      const currentPageEl = formPages[activePage - 1];
      const invalidField = currentPageEl.querySelector(':invalid');
      if (invalidField) {
        invalidField.reportValidity();
        return;
      }
      if (activePage < 3) showPage(activePage + 1);
    });
  });

  form.querySelectorAll('.prev-page-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (activePage > 1) showPage(activePage - 1);
    });
  });

  const editView = document.getElementById('editView');
  const reportView = document.getElementById('reportView');
  const reportPages = document.getElementById('reportPages');
  const backToEditBtn = document.getElementById('backToEditBtn');
  const printReportBtn = document.getElementById('printReportBtn');

  // ---------------------------------------------------------------
  // Conditional sub-fields (show/hide based on radio selection)
  // ---------------------------------------------------------------
  const conditionalFields = [
    { group: 'rtwStatus', value: 'returned', wrapId: 'returnedDateWrap' },
    { group: 'workType', value: 'other', wrapId: 'workTypeOtherWrap' },
    { group: 'medicalTreatment', value: 'yes_treatment', wrapId: 'medicalProviderWrap' },
    { group: 'medication', value: 'yes_medication', wrapId: 'medicationNameWrap' },
    { group: 'homeExercises', value: 'yes_exercises', wrapId: 'exercisesListWrap' }
  ];

  function refreshConditionalField(cfg) {
    const wrap = document.getElementById(cfg.wrapId);
    if (!wrap) return;
    const checked = form.querySelector('input[name="' + cfg.group + '"]:checked');
    wrap.classList.toggle('visible', !!checked && checked.value === cfg.value);
  }

  conditionalFields.forEach(function (cfg) {
    refreshConditionalField(cfg);
    form.querySelectorAll('input[name="' + cfg.group + '"]').forEach(function (radio) {
      radio.addEventListener('change', function () { refreshConditionalField(cfg); });
    });
  });

  // ---------------------------------------------------------------
  // Certification checkbox error handling
  // ---------------------------------------------------------------
  certifyCheck.addEventListener('change', function () {
    if (certifyCheck.checked) certifyError.style.display = 'none';
  });

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function formatStamp(date) {
    const datePart = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return 'Submitted: ' + datePart + ' ' + hours + ':' + minutes;
  }

  function box(checked) {
    return '<span class="pdf-checkbox' + (checked ? ' checked' : '') + '">' + (checked ? '&#10003;' : '') + '</span>';
  }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function reportHeader(claimNo) {
    return (
      '<div class="report-header">' +
        '<div class="report-logo-block">' +
          '<img src="./logo.jpeg" alt="Workers Compensation Board of Manitoba logo" class="report-logo-img">' +
          '<p>333 Broadway<br>Winnipeg, MB R3C 4W3<br>Phone: (204) 954-4321<br>Toll Free: 1-855-954-4321<br>wcb.mb.ca</p>' +
        '</div>' +
        '<div class="report-title-block">' +
          '<h1>Worker Progress Report</h1>' +
          '<span class="report-claim-box">Claim No. ' + esc(claimNo) + '</span>' +
          '<span class="report-claim-box">WP</span>' +
        '</div>' +
      '</div>'
    );
  }

  function reportFooter(pageNum, totalPages, stamp) {
    return (
      '<div class="report-footer-wrap">' +
        '<div class="report-footer">' +
          '<span>Worker App ID: 712041</span>' +
          '<span>' + esc(stamp) + '</span>' +
        '</div>' +
        '<div class="report-page-number">Page ' + pageNum + ' of ' + totalPages + '</div>' +
      '</div>'
    );
  }

  // ---------------------------------------------------------------
  // Build the 3 report pages from the form data
  // ---------------------------------------------------------------
  function buildReport(data, claimNo, stamp) {
    const totalPages = 3;

    // ---------- PAGE 1 ----------
    const page1 = (
      '<p class="report-intro"><span class="report-answer">' + esc(data.workerName) +
        '</span> provided the following updates in relation to their claim:</p>' +

      '<h3 class="report-section-title">Return to Work</h3>' +

      '<div class="report-box">' +
        '<div class="report-box-legend">Select one:</div>' +
        '<div class="report-row">' +
          '<div class="report-check-item">' + box(data.rtwStatus === 'not_missed') + ' I have not missed time from work</div>' +
          '<div class="report-check-item">' + box(data.rtwStatus === 'not_returned') + ' I have not returned to work</div>' +
          '<div class="report-check-item">' + box(data.rtwStatus === 'returned') + ' I returned to work on: ' +
            '<span class="report-underline">' + esc(formatDate(data.returnedDate)) + '<span class="report-field-caption">Date</span></span></div>' +
        '</div>' +
      '</div>' +

      '<div class="report-box">' +
        '<div class="report-box-legend">I am working:</div>' +
        '<div class="report-row">' +
          '<div class="report-check-item">' + box(data.workType === 'full_regular') + ' Full duties, regular hours</div>' +
          '<div class="report-check-item">' + box(data.workType === 'full_reduced') + ' Full duties, reduced hours</div>' +
          '<div class="report-check-item">' + box(data.workType === 'modified_regular') + ' Modified duties, regular hours</div>' +
          '<div class="report-check-item">' + box(data.workType === 'modified_reduced') + ' Modified duties, reduced hours</div>' +
          '<div class="report-check-item">' + box(data.workType === 'other') + ' Other: <span class="report-underline">' + esc(data.workTypeOtherText) + '</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="report-box">' +
        '<div class="report-box-legend">My return to work is going:</div>' +
        '<div class="report-blank-box">' + esc(data.rtwComments) + '</div>' +
      '</div>' +

      '<p class="report-inline-line">I expect to return to work on: <span class="report-underline">' +
        esc(formatDate(data.expectedReturnDate)) + '<span class="report-field-caption">Date</span></span></p>' +

      '<div class="report-box">' +
        '<div class="report-box-legend">I have the following concerns about returning to work:</div>' +
        '<div class="report-blank-box">' + esc(data.rtwConcerns) + '</div>' +
      '</div>' +

      '<p class="report-inline-line">I was most recently in contact with: <span class="report-underline">' +
        esc(data.contactName) + '</span> on <span class="report-underline">' + esc(formatDate(data.contactDate)) + '</span></p>' +

      '<h3 class="report-section-title">Recovery</h3>' +

      '<div class="report-box">' +
        '<div class="report-box-legend">Select one:</div>' +
        '<div class="report-row">' +
          '<div class="report-check-item">' + box(data.recoveryStatus === 'not_recovered') + ' I have not fully recovered from my workplace injury.</div>' +
          '<div class="report-check-item">' + box(data.recoveryStatus === 'recovered') + ' I have fully recovered from my workplace injury.</div>' +
        '</div>' +
      '</div>' +

      '<div class="report-box">' +
        '<div class="report-box-legend">I have provided the following comments about my recovery:</div>' +
        '<div class="report-blank-box">' + esc(data.recoveryComments) + '</div>' +
      '</div>'
    );

    // ---------- PAGE 2 ----------
    let painScaleHtml = '';
    for (let i = 1; i <= 10; i++) {
      painScaleHtml += '<div class="report-pain-num' + (String(i) === data.painScale ? ' selected' : '') + '">' + i + '</div>';
    }

    const page2 = (
      '<div class="report-box">' +
        '<div class="report-box-legend">I rate my current pain/discomfort on a scale of 1-10 (1 = no pain, 10 = severe pain):</div>' +
        '<div class="report-pain-scale">' + painScaleHtml + '</div>' +
      '</div>' +

      '<div class="report-box">' +
        '<div class="report-box-legend">Select one:</div>' +
        '<div class="report-row">' +
          '<div class="report-check-item">' + box(data.medicalTreatment === 'no_treatment') + ' I am not continuing to receive medical treatment for my workplace injury.</div>' +
          '<div class="report-check-item">' + box(data.medicalTreatment === 'yes_treatment') + ' I am continuing to receive medical treatment for my workplace injury from: <span class="report-underline">' + esc(data.medicalProviderType) + '</span></div>' +
        '</div>' +
      '</div>' +

      '<p class="report-inline-line">My last medical treatment was from <span class="report-underline">' + esc(formatDate(data.lastTreatmentDate)) +
        '<span class="report-field-caption">Date</span></span> <span class="report-underline">' + esc(data.lastTreatmentProvider) +
        '<span class="report-field-caption">Medical Provider Name</span></span></p>' +

      '<p class="report-inline-line">My next medical treatment is from <span class="report-underline">' + esc(formatDate(data.nextTreatmentDate)) +
        '<span class="report-field-caption">Date</span></span> <span class="report-underline">' + esc(data.nextTreatmentProvider) +
        '<span class="report-field-caption">Medical Provider Name</span></span></p>' +

      '<p class="report-inline-line">I am attending a Chiropractor or Physiotherapist (Frequency): <span class="report-underline">' + esc(data.chiroFrequency) + '</span></p>' +

      '<div class="report-box">' +
        '<div class="report-box-legend">Select one:</div>' +
        '<div class="report-row">' +
          '<div class="report-check-item">' + box(data.medication === 'no_medication') + ' I am not taking medication for my workplace injury.</div>' +
          '<div class="report-check-item">' + box(data.medication === 'yes_medication') + ' I am taking medication for my workplace injury: <span class="report-underline">' + esc(data.medicationName) + '</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="report-box">' +
        '<div class="report-box-legend">Select one:</div>' +
        '<div class="report-row">' +
          '<div class="report-check-item">' + box(data.homeExercises === 'no_exercises') + ' I am not doing home exercises for my workplace injury.</div>' +
          '<div class="report-check-item">' + box(data.homeExercises === 'yes_exercises') + ' I am doing home exercises for my workplace injury.</div>' +
        '</div>' +
        '<div class="report-blank-box">' + esc(data.exercisesList) + '</div>' +
      '</div>' +

      '<h3 class="report-section-title">Other Information</h3>' +
      '<div class="report-box">' +
        '<div class="report-box-legend">I would like to provide the following additional information about my claim/injury:</div>' +
        '<div class="report-blank-box">' + esc(data.otherInfo) + '</div>' +
      '</div>'
    );

    // ---------- PAGE 3 ----------
    const page3 = (
      '<p class="report-cert-text">' +
        'I certify that the information given on this form is true, correct and complete to the best of my ' +
        'knowledge. I agree to notify the Workers Compensation Board of Manitoba (WCB) immediately once I ' +
        'return to any form of work and/or employment. I understand that it is an offence to knowingly make ' +
        'a false statement to the WCB. I also understand that it is an offence to withhold information from ' +
        'WCB which affects my entitlement to compensation (e.g., full or partial recovery from injury, ability ' +
        'to return to work, sources of additional income, etc.). I understand that refusing to co-operate with, ' +
        'or follow my treatment, may result in the WCB reducing or suspending my benefits.' +
      '</p>' +
      '<p class="report-cert-text">I understand that the Privacy Notice applies to the personal information collected in this document.</p>'
    );

    const pages = [page1, page2, page3];

    let html = '';
    pages.forEach(function (content, idx) {
      html +=
        '<div class="report-page">' +
          reportHeader(claimNo) +
          '<div class="report-body">' + content + '</div>' +
          reportFooter(idx + 1, totalPages, stamp) +
        '</div>';
    });

    return html;
  }

  // ---------------------------------------------------------------
  // Gather form data into a plain object
  // ---------------------------------------------------------------
  function getRadioValue(name) {
    const el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function collectFormData() {
    return {
      workerName: form.workerName.value,
      reportDate: form.reportDate.value,
      rtwStatus: getRadioValue('rtwStatus'),
      returnedDate: form.returnedDate.value,
      workType: getRadioValue('workType'),
      workTypeOtherText: form.workTypeOtherText.value,
      rtwComments: form.rtwComments.value,
      expectedReturnDate: form.expectedReturnDate.value,
      rtwConcerns: form.rtwConcerns.value,
      contactName: form.contactName.value,
      contactDate: form.contactDate.value,
      recoveryStatus: getRadioValue('recoveryStatus'),
      recoveryComments: form.recoveryComments.value,
      painScale: getRadioValue('painScale'),
      medicalTreatment: getRadioValue('medicalTreatment'),
      medicalProviderType: form.medicalProviderType.value,
      lastTreatmentDate: form.lastTreatmentDate.value,
      lastTreatmentProvider: form.lastTreatmentProvider.value,
      nextTreatmentDate: form.nextTreatmentDate.value,
      nextTreatmentProvider: form.nextTreatmentProvider.value,
      chiroFrequency: form.chiroFrequency.value,
      medication: getRadioValue('medication'),
      medicationName: form.medicationName.value,
      homeExercises: getRadioValue('homeExercises'),
      exercisesList: form.exercisesList.value,
      otherInfo: form.otherInfo.value
    };
  }

  // ---------------------------------------------------------------
  // Submit handler — validates, then renders the 3-page PDF-style report
  // ---------------------------------------------------------------
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!certifyCheck.checked) {
      certifyError.style.display = 'block';
      certifyCheck.focus();
      return;
    }
    certifyError.style.display = 'none';

    const now = new Date();
    const stamp = formatStamp(now);
    submittedStamp.textContent = stamp;

    const claimNo = claimNoInput.value || '—'; // dynamic claim number, taken live from the input
    const data = collectFormData();

    reportPages.innerHTML = buildReport(data, claimNo, stamp);

    editView.style.display = 'none';
    reportView.style.display = 'block';
    window.scrollTo(0, 0);
  });

  // ---------------------------------------------------------------
  // Back to edit / print buttons
  // ---------------------------------------------------------------
  backToEditBtn.addEventListener('click', function () {
    reportView.style.display = 'none';
    editView.style.display = 'block';
    window.scrollTo(0, 0);
  });

  printReportBtn.addEventListener('click', function () {
    window.print();
  });
});