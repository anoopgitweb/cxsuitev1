const $=id=>document.getElementById(id);
const DEFAULT_SPARROW_MODEL_PATH='models/sparrow_cnx_sentimentmodel';
const DEFAULT_THEME_MODEL_PATH='models/theme_acpt_resolution_model';
const state={step:0,base:null,lookup:null,coverage:null,mapping:{},customDimensions:[],rules:{target:0,scale:'10',satisfiedMin:9,neutralMin:7,minimumSample:10,weekStart:'Sun',fiscalYearStartMonth:1,sparrowPath:DEFAULT_SPARROW_MODEL_PATH,themeModelPath:DEFAULT_THEME_MODEL_PATH},analysis:null,answers:[],sentimentAnswers:[]};
const steps=['Base File','File Ready','Coverage','Mapping','Custom Dimensions','Business Rules','Analysis','Results'];
const questions=[
 ['NPS trend over time','Mean by week, rolling direction, slope and period change'],['Overall NPS for the period','Mean, median, survey count, range and standard deviation'],['Highest and lowest managers','Manager NPS, rank, volume and distance from overall'],['Highest and lowest agents','Agent NPS, rank, volume and distance from overall'],['Manager improvement over time','Current versus previous period and trend direction'],['Manager decline over time','Negative movement, consistency and materiality'],['Agent improvement over time','Current versus previous performance and slope'],['Agent decline over time','Negative movement and decline consistency'],['Consistent manager performance','Standard deviation, range and coefficient of variation'],['Volatile manager performance','Dispersion, spikes and sudden movement'],['Consistent agent performance','Agent-level spread and stability'],['Volatile agent performance','Range, variability and outlier count'],['Highest and lowest week','Weekly NPS, volume, rank and overall comparison'],['Unusual spikes or drops','Deviation from mean and outlier screening'],['Managers above the organization average','Manager result minus overall NPS'],['Agents above the organization average','Agent result minus overall NPS'],['NPS distribution by manager','Mean, quartiles, spread and skew indicators'],['NPS distribution by agent','Mean, quartiles, spread and skew indicators'],['Manager performance gap','Best versus weakest result and team range'],['Balanced team performance','Narrow spread and similar agent outcomes'],['Top 10 agents','NPS, volume and rank reliability'],['Bottom 10 agents','NPS, volume and negative deviation'],['Agents improving month over month','Period movement and consistency count'],['Agents needing coaching','Below target, recent movement, volatility and volume'],['Managers needing attention','Low mean, decline, team spread and below-target share'],['Agents above target','Count and percentage at or above target'],['Agents below target','Count and percentage below target'],['Manager with most high-performing agents','Team average and agents above target'],['Leadership highlights and concerns','Target gap, movers, volatility, outliers and confidence']
];
questions.splice(28,1,
 ['What statistically significant changes occurred versus the previous period?','Equal-period change, significance, effect size and volume'],
 ['What are the key statistically significant insights and recommendations?','Integrated statistically guarded summary'],
 ['Which managers have the highest confidence in their NPS performance?','Sample size and confidence interval width'],
 ['Which agents may be unreliable because of low survey volume?','Minimum sample and reliability flag'],
 ['Which managers are improving despite survey-level fluctuations?','Rolling averages, trend slope, R-squared and variability'],
 ['Which agents have sustained improvement across multiple periods?','Consecutive improvement, slope and reliability'],
 ['Which managers are statistically stable despite volume changes?','Control limits, dispersion and survey volume'],
 ['Which agents have recently become performance outliers?','Recent versus historical result and outlier screen'],
 ['Which teams show the greatest consistency across agents?','Within-team dispersion and range'],
 ['Which teams show unusually high variation?','Team variation versus the organizational benchmark'],
 ['Which managers have the largest statistically significant shifts?','Current versus historical movement and reliability'],
 ['Which agents are closest to crossing the target?','Absolute target gap, uncertainty and sample size'],
 ['Which managers remained above average throughout the period?','Repeated period comparison against organizational NPS'],
 ['Which agents remained above average throughout the period?','Repeated period comparison against organizational NPS'],
 ['Are manager differences statistically significant?','Multi-group significance and practical interpretation'],
 ['Are agent differences statistically significant?','Multi-group significance with multiple-group caution'],
 ['Which periods demonstrated the highest stability?','Period dispersion, volume and control limits'],
 ['Which periods demonstrated the greatest volatility?','Period spread, rolling SD and outlier count'],
 ['Are recent improvements sustained or short-term fluctuations?','Recent movement versus long-run slope and R-squared'],
 ['Which agents have the highest confidence-adjusted rankings?','Lower confidence bound and sample threshold'],
 ['Which managers combine high performance and consistency?','Mean performance with stability adjustment'],
 ['What are the top priorities for leadership attention?','Reliability-weighted gap, decline, volatility and impact']
);
const sentimentQuestions=[
 [1,'What is the overall customer sentiment distribution?','Count each sentiment class and calculate its proportion across all classified verbatims. Exclude unclassified/invalid comments from the denominator unless reporting classification coverage.','Count, Percentage Share, Total Classified Comments, 95% CI for proportions','Report Positive %, Neutral %, Negative %, and total classified comments.'],
 [2,'What percentage of customers expressed Positive sentiment?','Calculate positive comments divided by total classified comments and estimate uncertainty using a proportion confidence interval.','Positive Count, Total Classified Count, Positive %, 95% CI','Positive % = Positive / Total Classified.'],
 [3,'What percentage of customers expressed Neutral sentiment?','Calculate neutral comments divided by total classified comments and estimate uncertainty using a proportion confidence interval.','Neutral Count, Total Classified Count, Neutral %, 95% CI','Neutral % = Neutral / Total Classified.'],
 [4,'What percentage of customers expressed Negative sentiment?','Calculate negative comments divided by total classified comments and estimate uncertainty using a proportion confidence interval.','Negative Count, Total Classified Count, Negative %, 95% CI','Negative % = Negative / Total Classified.'],
 [5,'What is the Positive-to-Negative sentiment ratio?','Compare volume of positive sentiment to negative sentiment. Use smoothing when negative count is zero to avoid division errors.','Positive Count, Negative Count, Ratio, Log Ratio','Ratio > 1 indicates more positive than negative sentiment.'],
 [6,'What is the Net Sentiment Score?','Calculate Positive % minus Negative % to summarize overall sentiment balance.','Positive %, Negative %, Net Sentiment Score, 95% CI','NSS = Positive % - Negative %.'],
 [7,'What is the sentiment confidence level of the analysis?','Use model confidence if available; otherwise use statistical reliability from sample size and sentiment variability.','Average Confidence, Median Confidence, Low Confidence Count, Sample Size','High confidence requires sufficient sample and low uncertainty.'],
 [8,'What percentage of customer comments could be successfully classified?','Divide successfully classified verbatims by total verbatims available.','Total Verbatims, Classified Verbatims, Classification Rate','Classification Rate = Classified / Total Verbatims.'],
 [9,'What percentage of comments remained unclassified or low confidence?','Count comments without sentiment or below confidence threshold and divide by total verbatims.','Unclassified Count, Low Confidence Count, Total Verbatims, %','Flag if unclassified/low-confidence rate exceeds threshold.'],
 [10,'What is the overall sentiment health score?','Create a composite score using net sentiment, negative sentiment rate, classification reliability, and stability.','Net Sentiment Score, Negative %, Stability Index, Confidence','Score should be normalized to 0-100 and labelled Strong/Stable/At Risk.'],
 [11,'How is customer sentiment trending over time?','Convert sentiment to numeric score and aggregate by week/month; assess direction using regression and rolling averages.','Sentiment Score, Period Mean, Rolling Average, Trend Slope, R-squared','Improving if slope positive and meaningful; declining if negative.'],
 [12,'Has customer sentiment improved or declined compared to the previous period?','Compare equal current and previous periods using net sentiment or average sentiment score.','Current NSS, Previous NSS, Difference, % Change, 95% CI','Report improvement/decline only if sample thresholds are met.'],
 [13,'Is customer sentiment improving, stable, or declining?','Combine trend slope, period-over-period movement, and statistical significance to classify direction.','Trend Slope, p-value, Effect Size, Rolling Average','Improving/Declining only when trend is statistically and practically meaningful.'],
 [14,'Are recent sentiment changes statistically significant?','Test whether sentiment distribution or sentiment score differs between two comparable periods.','Chi-square Test, Two-proportion z-test, Mann-Whitney U, p-value','Significant if p < 0.05 and sample size is adequate.'],
 [15,'How consistent is customer sentiment over time?','Measure variability of sentiment score across periods. Lower variability means greater consistency.','Standard Deviation, Coefficient of Variation, Rolling SD, IQR','Classify consistency as High/Moderate/Low.'],
 [16,'Were there statistically significant spikes or drops in sentiment?','Detect outlier periods against historical sentiment behavior.','Z-score, IQR, Control Limits, Rolling Mean Deviation','Flag periods outside control limits or high z-score.'],
 [17,'Which agents have the healthiest customer sentiment profile?','Rank agents using net sentiment, positive %, negative %, sample size, and reliability.','NSS, Positive %, Negative %, Survey Count, 95% CI, Percentile Rank','Rank only agents meeting minimum sample threshold.'],
 [18,'Which agents have shown the greatest improvement in customer sentiment?','Compare each agent current vs previous sentiment using equal windows.','Current NSS, Previous NSS, Difference, Trend Slope, p-value','Improvement must meet sample and significance rules.'],
 [19,'Which agents have shown the greatest decline in customer sentiment?','Compare each agent current vs previous sentiment and identify significant negative movement.','Current NSS, Previous NSS, Decline %, Trend Slope, p-value','Flag sustained decline, not isolated one-period dip.'],
 [20,'Which agents demonstrate the most consistent customer sentiment?','Measure agent-level variability in sentiment across time periods.','Sentiment Score SD, CV, IQR, Rolling SD','Most consistent = low variability with adequate sample size.'],
 [21,'Which agents demonstrate the highest sentiment volatility?','Identify agents with the highest variability in sentiment over time.','SD, CV, Range, IQR, Outlier Count','Volatile if variability exceeds peer benchmark.'],
 [22,'Which agents consistently outperform the organizational sentiment benchmark?','Compare each agent sentiment metrics against organizational average across periods.','Agent NSS, Org NSS, Difference, CI, Percentile Rank','Outperform only if above benchmark consistently and reliably.'],
 [23,'Which agents require attention based on sustained negative sentiment trends?','Identify agents with high negative sentiment, declining trend, and statistically reliable sample size.','Negative %, NSS, Trend Slope, p-value, Survey Count','Phrase as "requires review/attention"; do not infer cause.'],
 [24,'Which agents rank highest based on customer sentiment?','Rank agents by sentiment health score using reliability adjustment.','Sentiment Health Score, NSS, Positive %, Negative %, Count','Use confidence-adjusted rank where possible.'],
 [25,'Which agents rank lowest based on customer sentiment?','Rank agents with low net sentiment and high negative sentiment, ensuring sufficient survey volume.','Sentiment Health Score, NSS, Negative %, Count, CI','Low sample agents should be marked insufficient data.'],
 [26,'Which agents have the highest percentage of positive customer interactions?','Calculate positive sentiment percentage by agent and rank with sample threshold.','Positive Count, Total Classified, Positive %, 95% CI','Rank by Positive %, but show survey count and CI.'],
 [27,'Which managers have the healthiest customer sentiment profile?','Aggregate sentiment at manager level and rank using sentiment health and reliability.','Manager NSS, Positive %, Negative %, Count, CI, Percentile','Rank only managers with sufficient records.'],
 [28,'Which managers have shown the greatest improvement in customer sentiment?','Compare current vs previous manager-level sentiment across equal windows.','Current NSS, Previous NSS, Difference, Trend Slope, p-value','Report statistically meaningful improvement only.'],
 [29,'Which managers have shown the greatest decline in customer sentiment?','Identify manager-level sentiment deterioration using period comparison and trend.','Current NSS, Previous NSS, Decline %, Trend Slope, p-value','Flag sustained statistically supported decline.'],
 [30,'Which managers demonstrate the most consistent customer sentiment?','Measure manager-level sentiment variability across periods.','SD, CV, IQR, Rolling SD, Count','Consistent managers have low variability and sufficient sample.'],
 [31,'Which managers demonstrate the highest sentiment volatility?','Identify managers with unstable sentiment performance over time.','SD, CV, Range, IQR, Outlier Count','High volatility if above organizational variability benchmark.'],
 [32,'Which managers consistently outperform the organizational sentiment benchmark?','Compare manager sentiment against organizational benchmark over multiple periods.','Manager NSS, Org NSS, Difference, CI, Percentile Rank','Outperformance requires consistent positive gap.'],
 [33,'Which managers require attention based on sustained negative sentiment trends?','Flag managers with elevated negative sentiment, downward trend, and sufficient data.','Negative %, NSS, Trend Slope, p-value, Count','Use as review signal; do not state causal reason.'],
 [34,'Which managers rank highest based on customer sentiment?','Rank managers using sentiment health score with confidence adjustment.','Health Score, NSS, Positive %, Negative %, Count, CI','Use reliability-adjusted ranking.'],
 [35,'Which managers rank lowest based on customer sentiment?','Identify lowest manager sentiment rankings after applying sample thresholds.','Health Score, NSS, Negative %, Count, CI','Mark low-volume managers as insufficient data.'],
 [36,'Which managers have the highest percentage of positive customer interactions?','Calculate positive sentiment percentage by manager and rank with reliability context.','Positive Count, Total Classified, Positive %, 95% CI','Show rank, count, and confidence interval.'],
 [37,'How closely does customer sentiment align with the NPS band?','Compare sentiment labels with the NPS band for each response: Promoter, Passive, or Detractor.','Spearman Correlation, Pearson Correlation, Cross-tab, p-value','Sentiment is read from the verbatim. NPS band is used only as a validation signal.'],
 [38,'How often does customer sentiment disagree with the NPS band?','Define mismatch rules using Promoter, Passive, and Detractor bands. Example: Promoter with negative sentiment, or Detractor with positive sentiment.','Mismatch Count, Mismatch %, Cross-tab, Chi-square','Report mismatch rate overall and by period; do not treat mismatch as an error automatically.'],
 [39,'Which agents have the strongest alignment between sentiment and NPS bands?','Calculate agent-level agreement between sentiment category and Promoter, Passive, or Detractor band.','Agreement %, Cohen Kappa, Correlation, Count','Rank only agents with adequate matched sentiment and NPS-band records.'],
 [40,'Which managers have the strongest alignment between sentiment and NPS bands?','Calculate manager-level agreement between sentiment category and Promoter, Passive, or Detractor band.','Agreement %, Cohen Kappa, Correlation, Count','Higher agreement means customer language and NPS band tell a similar story.'],
 [41,'Which agents have the highest number of sentiment-to-NPS-band mismatches?','Count and rate sentiment-to-NPS-band mismatches by agent; use percentage to avoid volume bias.','Mismatch Count, Mismatch %, Total Count, CI','Prioritize high mismatch percentage only when matched record volume is adequate.'],
 [42,'Which managers have the highest number of sentiment-to-NPS-band mismatches?','Count and rate sentiment-to-NPS-band mismatches by manager; separate volume from rate.','Mismatch Count, Mismatch %, Total Count, CI','Use mismatch percentage for fair comparison and validate with verbatim examples.'],
 [43,'Is the relationship between sentiment and NPS bands strengthening or weakening over time?','Calculate correlation/agreement between sentiment and NPS band by period and track its direction.','Period Correlation, Period Kappa, Trend Slope, R-squared','Strengthening means the agreement metric increases over time; it does not prove causality.'],
 [44,'What statistically significant sentiment changes occurred during the reporting period?','Scan periods, agents, and managers for significant sentiment changes versus prior period or benchmark.','Change %, p-value, Effect Size, CI, Count','Return only statistically supported findings.'],
 [45,'Which reporting period recorded the healthiest customer sentiment?','Aggregate sentiment health by period and rank periods.','Period NSS, Positive %, Negative %, Count, CI','Best period must meet sample threshold.'],
 [46,'Which reporting period recorded the weakest customer sentiment?','Aggregate sentiment health by period and identify lowest reliable period.','Period NSS, Negative %, Count, CI','Flag low sample periods separately.'],
 [47,'Which reporting period experienced the greatest sentiment improvement?','Compare each period with previous comparable period and rank improvements.','NSS Difference, % Change, p-value, Effect Size','Use equal periods and sample thresholds.'],
 [48,'Which reporting period experienced the greatest sentiment decline?','Compare each period with previous comparable period and rank declines.','NSS Difference, % Decline, p-value, Effect Size','Report decline only when statistically meaningful.'],
 [49,'What are the highest-confidence findings from the sentiment analysis?','Identify insights with strong sample size, narrow confidence intervals, and significant results.','Sample Size, CI Width, p-value, Effect Size, Reliability Score','Return findings with high reliability score.'],
 [50,'What are the key customer sentiment insights from the selected reporting period?','Synthesize the statistically strongest sentiment findings across overall, agent, manager, time, and NPS alignment views.','NSS, Trend, Significant Changes, Rankings, Reliability Score','Include only findings supported by sufficient data and confidence.']
];

function setupStepLabel(){
  if(state.step<0||state.step>=steps.length)return '';
  return `Step ${state.step+1} of ${steps.length} - ${steps[state.step]}`;
}
function setupBackTarget(){
  const screen=document.body.dataset.screen||'';
  if(state.step<=0||screen==='analysis-in-progress'||screen==='analysis-complete')return null;
  if(screen.includes('lookup-ready'))return showLookup;
  if(screen.includes('lookup'))return showCoverage;
  if(state.step===1)return showUpload;
  if(state.step===2)return showUploadComplete;
  if(state.step===3)return showCoverage;
  if(state.step===4)return showMapping;
  if(state.step===5)return showCustomDimensions;
  if(state.step===6)return showRules;
  return null;
}
function bindSetupBack(){
  const button=$('setupBack');
  const target=setupBackTarget();
  if(button&&target)button.onclick=target;
}
function setupPrimaryAction(){
  const screen=document.body.dataset.screen||'';
  if(screen==='upload-completed-successfully')return {id:'continue',label:'Continue'};
  if(screen==='lookup-ready')return {id:'confirmKeys',label:'Confirm keys'};
  if(screen==='please-confirm')return {id:'confirmMapping',label:'Confirm mapping'};
  if(screen==='custom-dimensions')return {id:'confirmCustomDimensions',label:'Confirm dimensions'};
  if(screen==='final-setup')return {id:'run',label:'Start analysis',arrow:true};
  if(screen==='ready-to-analyze')return {id:'startConfirmed',label:'Start analysis',arrow:true};
  return null;
}
function renderSetupTopActions(){const host=$('analysisTopActions');if(!host)return;const stepLabel=setupStepLabel();const showBack=!!setupBackTarget();const primary=setupPrimaryAction();if(!stepLabel&&!showBack&&!primary){host.classList.add('hidden');host.classList.remove('setup-top-actions');host.innerHTML='';return}host.classList.remove('hidden');host.classList.add('setup-top-actions');host.setAttribute('aria-label','Setup step actions');host.innerHTML=`${stepLabel?`<span class="setup-top-step">${stepLabel}</span>`:''}${showBack?'<button class="setup-page-back" id="setupBack" type="button">Back</button>':''}${primary?`<button class="setup-page-primary" id="${primary.id}" type="button">${primary.label}${primary.arrow?' <span aria-hidden="true">&rarr;</span>':''}</button>`:''}`;bindSetupBack();}
function renderRail(){const rail=$('stageRail');if(!rail)return;const details=['Upload workbook','Confirm readiness','Coverage check','Map columns','Choose extra dimensions','Rules and engines','Run analysis','Review outputs'];rail.innerHTML='<div class="rail-product-card"><div class="rail-product-mark">NI</div><div><strong>NPS Intelligence</strong><span>Guided setup</span></div></div><span class="nav-section-title">Workflow</span><div class="rail-step-list">'+steps.map((step,index)=>`<button class="stage-item ${index<state.step?'done':''} ${index===state.step?'active':''}" type="button" disabled><span class="stage-number">${index+1}</span><span class="stage-copy"><strong>${escapeHtml(step)}</strong><small>${escapeHtml(details[index]||'')}</small></span><span class="stage-chevron">ï¿½</span></button>`).join('')+'</div>'}function setScreen(eyebrow,title,description,html){guideManualHidden=false;document.body.dataset.screen=String(eyebrow||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');document.body.classList.add('compact-guided-step');$('eyebrow').textContent=eyebrow;$('title').textContent=title;$('description').textContent=description;$('content').innerHTML=html;renderSetupTopActions();renderRail();updateGuideForScreen(eyebrow,title,description);window.scrollTo({top:0,behavior:'smooth'});}
function clearGuideTarget(){document.querySelectorAll('.guide-target').forEach(el=>el.classList.remove('guide-target'));const avatar=$('guideAvatar');if(avatar){avatar.classList.remove('targeting');avatar.style.removeProperty('--guide-x');avatar.style.removeProperty('--guide-y')}}
function aimGuideAt(selector){clearGuideTarget();const avatar=$('guideAvatar'),target=document.querySelector(selector);if(!avatar||!target)return;avatar.classList.add('targeting')}
let guideHideTimer=0,guideManualHidden=false;
function scheduleGuideHide(){clearTimeout(guideHideTimer);guideHideTimer=setTimeout(()=>$('guideAvatar')?.classList.add('guide-collapsed'),6000)}
function revealGuide(){const avatar=$('guideAvatar');if(!avatar)return;guideManualHidden=false;avatar.classList.remove('guide-collapsed');scheduleGuideHide()}
function hideGuide(){const avatar=$('guideAvatar');if(!avatar)return;guideManualHidden=true;clearTimeout(guideHideTimer);avatar.classList.add('guide-collapsed')}
function toggleGuide(){const avatar=$('guideAvatar');if(!avatar)return;if(avatar.classList.contains('guide-collapsed'))revealGuide();else hideGuide()}
function guideSay(message,mode='',targetSelector=''){const avatar=$('guideAvatar'),text=$('guideText');if(!avatar||!text)return;const parts=String(message||'').split(/(?<=[.!?])\s+/).map(part=>part.trim()).filter(Boolean);if(parts.length>1){const lead=parts.shift();text.innerHTML=`<span class="guide-message-title">${escapeHtml(lead)}</span><ul class="guide-points">${parts.map(part=>`<li>${escapeHtml(part)}</li>`).join('')}</ul>`}else{text.textContent=message}avatar.className=`guide-avatar ${mode||''}`.trim();if(targetSelector)aimGuideAt(targetSelector);else clearGuideTarget();if(guideManualHidden){clearTimeout(guideHideTimer);avatar.classList.add('guide-collapsed')}else scheduleGuideHide()}
function updateGuideForScreen(eyebrow='',title='',description=''){
  const e=String(eyebrow).toLowerCase(),t=String(title).toLowerCase();
  if(e.includes('begin'))return guideSay('Welcome. Choose the Base File that has one row per customer response. It should include an NPS score or NPS category. Date is strongly recommended because it unlocks weekly, monthly, and fiscal-quarter trends. Agent and Manager fields unlock people and team views. Feedback/verbatim is optional for score-only analysis, but needed if you want sentiment or themes. Click Choose Base File when you are ready.','hint','#chooseBase');
  if(e.includes('processing your file'))return guideSay('Reading your workbook now. Keep this window open while I upload the file locally, validate that Excel can be read, detect worksheets, count rows, inspect columns, check blanks, and prepare suggested mappings. If the workbook is large, this step can take a little longer. The progress panel will show the current stage and row status.','working');
  if(e.includes('select worksheet'))return guideSay('Worksheet selection. Pick the sheet that contains the actual survey records for the Base File, or the lookup attributes for the Lookup File. Use Preview sheet before selecting so you can confirm the headers and first rows without opening Excel. Avoid summary, pivot, instruction, hidden, or formula-only sheets unless that is truly the data you want analyzed.','hint','#sheetSelect');
  if(e.includes('upload completed')){const warnings=Number(state.base?.warnings?.length||0);const clean=warnings===0;return guideSay(clean?`Hurray! No warnings found, so your dataset looks neat and ready for the next step. I found ${(state.base?.rows||0).toLocaleString()} rows, ${state.base?.columns?.length||0} fields, and ${state.base?.sheetCount||1} worksheet${(state.base?.sheetCount||1)>1?'s':''}. Review the cards once, then click Continue and I will help you decide if this file needs lookup enrichment.`:`Your Base File is ready, but I found ${warnings} warning${warnings===1?'':'s'} worth reviewing. Check the warning card first. If the warning is expected, you can continue; if it points to missing dates, blank scores, or weak fields, consider correcting the file before analysis.`,clean?'success':'hint','#continue')};
  if(e.includes('quick check'))return guideSay('Coverage check. Choose Yes when the Base File already has the NPS result, response date, agent or employee identifier, manager or team, and any fields you want to compare. Choose No when useful attributes live in another workbook, such as manager, team, site, region, tenure, channel, employee profile, or roster details. If you choose No, the Lookup File must share a reliable key with the Base File, such as Case ID, Agent ID, Employee ID, or Customer ID.','hint','#complete');
  if(e.includes('lookup ready'))return guideSay('Lookup key guide. Select the column in the Base File and Lookup File that represents the same record or person. Good keys have matching values, very few blanks, and few duplicates. Use the previews below to confirm both sheets are the right ones and that the selected key values look similar. I will use this key only to enrich the Base File before mapping columns.','hint','#confirmKeys');
  if(e.includes('lookup'))return guideSay('Lookup file guide. Upload a lookup only when the Base File is missing useful business context. Good lookup fields include manager, team, site, region, channel, tenure, queue, employee profile, or customer segment. The lookup should not replace the survey file; it should enrich it. Make sure it contains a unique key also present in the Base File.','hint','#chooseLookup');
  if(e.includes('confirm')||t.includes('mapped'))return guideSay('Column mapping guide. Feedback / verbatim: map the comment column when you want sentiment or themes. NPS score: map the numeric 0 to 10 rating used for averages and score trends. NPS category: map only if you have text labels such as Promoter, Passive, or Detractor. Response date: map this for weekly, monthly, and fiscal-quarter trends. Agent and Manager / team: map these for people and team insights. Wave / period and Tenure are optional, but useful for segmentation. Correct any dropdown, then click Confirm mapping.','hint','#confirmMapping');
  if(e.includes('business')||e.includes('final setup')||t.includes('rules'))return guideSay('Final setup guide. NPS target: enter the official NPS goal; this drives target gap and leadership readouts. Score scale: confirm the NPS score scale used in the file. Promoter starts at: choose the lowest score that counts as promoter; standard NPS uses 9. Passive starts at: choose the lowest score that counts as passive; standard NPS uses 7. Minimum sample for ranking: set the minimum records needed before agents, managers, periods, or segments are ranked. Week starts on: choose the first day of the account reporting week so weekly trends line up correctly. Fiscal year starts in: choose the client fiscal year start month when quarters do not follow the calendar year. Sparrow sentiment: turn it on only when verbatims have useful customer comments and you want tone added. Themes, ACPT, and Resolution Status: select the outputs you want from the trained local model. Note: local NPS calculations always run; leave Sparrow, Themes, ACPT, and Resolution Status off when comments are mostly blank or score-only analysis is enough.','hint','#run');
  if(e.includes('ready to analyze'))return guideSay('Pre-flight check. This is the last review before analysis starts. Confirm the selected engines, analysis-file preview, and run-log location. I am showing the final merged sheet preview automatically so you can inspect the first rows that will be analyzed. When it looks right, click Start analysis and keep this window open until the run is complete.','hint','#startConfirmed');
  if(e.includes('starting analysis'))return guideSay('Starting analysis. I am locking your mappings, NPS rules, calendar settings, selected engines, and lookup enrichment for this run. Next I create the run log, then hand the job to the local analyzer. The live progress page will open automatically.','working');
  if(e.includes('analysis in progress')){const sentiment=state.rules.sparrow?'Sparrow sentiment model':'Local Rules',themes=state.rules.theme?'Owl trained model':'Local Rules';return guideSay(`Live analysis guide. Core NPS calculations are running locally on this computer. Sentiment analysis: ${sentiment}. Owl Theme/ACPT/Resolution classification: ${themes}. I am validating required fields, processing records, calculating leadership questions, building evidence tables, and preparing readouts. Keep this page open and watch the stage, rows processed, elapsed time, and estimated remaining time.`,'working')}
  if(e.includes('analysis complete'))return guideSay(`Analysis complete. I processed ${(state.base?.rows||0).toLocaleString()} rows and prepared the review outputs. Start with Data Set Summary to confirm the file. Use Results for question-level answers and statistical evidence. Use Sentiment Briefing when sentiment was enabled. Use Insights Readout for role-based review. Board Room HTML is presentation-ready, and Download Excel contains the full audit evidence.`,'success','#dashboard');
  if(e.includes('action needed'))return guideSay('Action needed. Read the error message first, then check the mapped columns and workbook format. Common fixes are: choose the correct worksheet, map a valid score or category field, make sure required columns are not blank, close Excel locks, or try a smaller clean copy. Use Try again after correcting the issue.','hint','#retry');
  return guideSay(`${title} ${description}`.trim()||'Use the action shown on this screen. I will explain the next step as soon as it is ready.','hint')
}
function guideDashboardHandoff(){try{sessionStorage.setItem('npsDashboardGuideTour','1')}catch{}guideSay('I am opening the Detailed Dashboard now. This is the visual dashboard for deeper review, leadership storytelling, trend views, and export-ready summaries.','success')}
function openDetailedDashboard(){guideDashboardHandoff();setTimeout(()=>{const opened=window.open('/apps/nps-intelligence-hub/index.html?view=executive&tour=1','_blank');if(opened)opened.focus();else window.location.href='/apps/nps-intelligence-hub/index.html?view=executive&tour=1'},450)}
function addGuideDashboardButton(){const text=$('guideText'),dashboard=$('dashboard'),boardRoom=$('boardRoomHtml'),download=$('downloadResults');if(!text)return;const existing=$('guideDashboardActions');if(existing)existing.remove();text.insertAdjacentHTML('beforeend','<div class="guide-dashboard-actions" id="guideDashboardActions"><button class="guide-dashboard-button" id="guideHelpMeButton" type="button">Help Me</button><div class="guide-dashboard-actions" id="guideHelpMenu" hidden><button class="guide-dashboard-button guide-secondary-button" id="guidePerformanceButton" type="button">Performance Overview</button><button class="guide-dashboard-button guide-secondary-button" id="guideReadoutButton" type="button">Insights Readout</button><button class="guide-dashboard-button guide-secondary-button" id="guideSentimentButton" type="button">Sentiment Scores</button><button class="guide-dashboard-button guide-secondary-button" id="guideHtmlButton" type="button">HTML / PDF Version</button><button class="guide-dashboard-button guide-secondary-button" id="guideDetailedDashboardButton" type="button">Open Detailed Dashboard</button><button class="guide-dashboard-button guide-secondary-button" id="guideDownloadExcelButton" type="button">Download Excel</button></div></div>');const menu=$('guideHelpMenu');$('guideHelpMeButton').onclick=event=>{event.stopPropagation();if(menu)menu.hidden=!menu.hidden};const switchTab=tab=>{const button=document.querySelector(`.result-tab[data-tab="${tab}"]`);if(button)button.click();else if(typeof renderResultTab==='function')renderResultTab(tab)};$('guidePerformanceButton').onclick=event=>{event.stopPropagation();switchTab('performance')};$('guideReadoutButton').onclick=event=>{event.stopPropagation();switchTab('readout')};$('guideSentimentButton').onclick=event=>{event.stopPropagation();switchTab('sentiment')};$('guideHtmlButton').onclick=event=>{event.stopPropagation();if(boardRoom)boardRoom.click();else createBoardRoomHtml();guideSay('I opened the HTML version. Use the Download PDF button inside that report window when you need a PDF copy.','success');setTimeout(addGuideDashboardButton,40)};$('guideDetailedDashboardButton').onclick=event=>{event.stopPropagation();if(dashboard)dashboard.click();else guideSay('The Detailed Dashboard action will be available after the completed analysis actions finish loading.','warning')};$('guideDownloadExcelButton').onclick=event=>{event.stopPropagation();if(download)download.click();else downloadResultsExcel()}}function btn(label,id,primary=true,disabled=false){return `<button class="btn ${primary?'primary':''}" id="${id}" ${disabled?'disabled':''}>${label}</button>`}
function topAction(label,id,icon){return `<button class="top-action-button" id="${id}" type="button" title="${label}" aria-label="${label}"><span>${icon}</span><em>${label}</em></button>`}
function renderAnalysisTopActions(){const host=$('analysisTopActions');if(!host)return;host.classList.add('hidden');host.classList.remove('setup-top-actions');host.setAttribute('aria-label','Completed analysis actions available from the Signal Guide');host.innerHTML='<button id="dashboard" type="button" hidden></button><button id="boardRoomHtml" type="button" hidden></button><button id="downloadResults" type="button" hidden></button>';dashboard.onclick=openDetailedDashboard;$('boardRoomHtml').onclick=createBoardRoomHtml;$('downloadResults').onclick=downloadResultsExcel}
function fail(message){const old=document.querySelector('.error');if(old)old.remove();$('content').insertAdjacentHTML('beforeend',`<div class="error">${message}</div>`)}
function fileSize(bytes){return bytes>1048576?`${(bytes/1048576).toFixed(1)} MB`:`${(bytes/1024).toFixed(0)} KB`}
function readDataUrl(file,onProgress){return new Promise((resolve,reject)=>{const r=new FileReader();r.onprogress=e=>onProgress?.(e.loaded,e.total);r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file)})}
async function post(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw new Error('The local analyzer returned an unexpected response. Please confirm the Version 23.6 server is running.')}if(!r.ok||!data.ok)throw new Error(data.error||'The operation could not be completed.');return data}


function fmtTime(seconds){seconds=Math.max(0,Math.round(Number(seconds)||0));const m=Math.floor(seconds/60),sec=seconds%60;return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`}
function processEta(start,pct){const elapsed=(Date.now()-start)/1000;if(!pct||pct<5)return'Calculating';const remaining=elapsed*(100-pct)/pct;return remaining>2?fmtTime(remaining):'less than 10 sec'}
function parseRows(message){const text=String(message||'');let match=text.match(/([\d,]+)\s*\/\s*([\d,]+)\s*rows/i);if(match)return{done:Number(match[1].replace(/,/g,'')),total:Number(match[2].replace(/,/g,''))};match=text.match(/row\s+([\d,]+)\s+of\s+([\d,]+)/i);if(match)return{done:Number(match[1].replace(/,/g,'')),total:Number(match[2].replace(/,/g,''))};match=text.match(/for\s+([\d,]+)\s+rows/i);if(match)return{done:0,total:Number(match[1].replace(/,/g,''))};match=text.match(/Profiling\s+([\d,]+)\s+analyzed rows/i);if(match){const n=Number(match[1].replace(/,/g,''));return{done:n,total:n}}return null}
function friendlyStage(message,pct=0){const text=String(message||'').toLowerCase();if(text.includes('validating'))return'Validating required fields';if(text.includes('cleaning')||text.includes('preparing local analysis'))return'Cleaning and preparing data';if(text.includes('local rules')||text.includes('sentiment'))return'Processing records';if(text.includes('sparrow'))return'Reading sentiment with Sparrow';if(text.includes('acpt')||text.includes('agent, customer, process, or technology'))return'Classifying ACPT ownership';if(text.includes('owl')||text.includes('theme'))return'Generating Owl themes';if(text.includes('weekly')||text.includes('summar'))return'Generating summary';if(text.includes('profiling'))return'Checking row count and output columns';if(text.includes('publishing')||text.includes('dashboard')||text.includes('export'))return'Preparing output';if(text.includes('complete')||pct>=100)return'Finalizing results';return'Processing records'}
function reassurance(message,pct=0,total=0){const text=String(message||'').toLowerCase();if(pct>=95)return'Almost done, preparing the output.';if(total>=50000)return'Large files may take a few minutes. Please do not refresh or close the page.';if(text.includes('profiling'))return'We are still processing your file and validating the final output.';if(text.includes('validating'))return'Your data is being validated.';if(text.includes('local rules'))return'We are processing each record safely on this computer.';return'Please do not refresh or close the page while this is running.'}
function coachTip(stage='',kind='upload'){const text=String(stage||'').toLowerCase();if(kind==='analysis'){if(text.includes('validating'))return'Coach Tip: I am checking the mapped fields now. Keep this page open while I confirm the setup.';if(text.includes('processing'))return'Coach Tip: I am reading the records and building the evidence. You can watch the row count to see progress.';if(text.includes('summary')||text.includes('output'))return'Coach Tip: The heavy work is mostly done. I am preparing the answer tables and evidence views.';return'Coach Tip: I will keep updating the stage, row progress, elapsed time, and estimated remaining time.'}if(text.includes('uploading'))return'Coach Tip: I am transferring the workbook locally. Please do not refresh or close the page.';if(text.includes('validating'))return'Coach Tip: I am checking whether the file is a valid Excel workbook before reading it.';if(text.includes('reading'))return'Coach Tip: I am opening the worksheet. Larger workbooks can stay here for a few minutes.';if(text.includes('detecting')||text.includes('checking'))return'Coach Tip: I am detecting sheets, columns, rows, blanks, and likely field mappings.';if(text.includes('finalizing'))return'Coach Tip: Upload is complete. Next I will ask you to confirm the file coverage and mappings.';return'Coach Tip: Follow the progress here. I will tell you the next action when this step is complete.'}
function progressShell(kind,file){const title=kind==='upload'?'File processing status':'Analysis processing status';return `<div class="process-shell"><section class="process-main"><div class="progress-ring" id="processRing"><strong id="processPct">0%</strong></div><div><span class="eyebrow">${title}</span><h2 id="processStage">Starting</h2><p id="processMessage">Preparing...</p><div class="process-bar"><span id="processBar"></span></div></div></section><div class="process-grid"><div class="stat"><span>File name</span><strong id="processFile">${escapeHtml(file?.name||state.base?.file?.name||'Current workbook')}</strong></div><div class="stat"><span>File size</span><strong id="processSize">${file?.size?fileSize(file.size):'Already uploaded'}</strong></div><div class="stat"><span>Status</span><strong id="processStatus">Starting</strong></div><div class="stat"><span>Elapsed time</span><strong id="processElapsed">00:00</strong></div><div class="stat"><span>Rows processed</span><strong id="processRows">Pending</strong></div><div class="stat"><span>Estimated remaining</span><strong id="processEta">Calculating</strong></div></div><div class="coach-tip process-coach" id="processCoach">${coachTip('Starting',kind)}</div><div class="live-note" id="processNote">Large files may take a few minutes. Please do not refresh or close the page.</div><div class="stage-list" id="processStages"></div></div>`}
const uploadStages=['Uploading file','Validating file format','Reading worksheet','Detecting sheets and columns','Checking row count','Cleaning and preparing data','Validating required fields','Finalizing results'];
const analysisStages=['Validating required fields','Cleaning and preparing data','Processing records','Generating themes','Generating summary','Preparing output','Finalizing results'];
function renderStageList(stages,current){const root=$('processStages');if(!root)return;root.innerHTML=stages.map(stage=>`<span class="stage-chip ${stage===current?'active':''}">${stage}</span>`).join('')}
function updateProcessView({pct=0,stage='Processing',message='',status='Running',rows='',note='',eta=''}){pct=Math.max(0,Math.min(100,Math.round(Number(pct)||0)));$('processRing')?.style.setProperty('--progress',pct+'%');if($('processPct'))$('processPct').textContent=pct+'%';if($('processBar'))$('processBar').style.width=pct+'%';if($('processStage'))$('processStage').textContent=stage;if($('processMessage'))$('processMessage').textContent=message||stage;if($('processStatus'))$('processStatus').textContent=status;if($('processRows'))$('processRows').textContent=rows||'Pending';if($('processEta'))$('processEta').textContent=eta||'Calculating';if($('processNote'))$('processNote').textContent=note||'Please do not refresh or close the page.';if($('processCoach'))$('processCoach').textContent=coachTip(stage,document.body.textContent.includes('Analysis processing status')?'analysis':'upload')}
function startElapsedClock(start){clearInterval(state.progressTimer);state.progressTimer=setInterval(()=>{if($('processElapsed'))$('processElapsed').textContent=fmtTime((Date.now()-start)/1000)},1000)}
function stopElapsedClock(){clearInterval(state.progressTimer);state.progressTimer=null}
function showProcessError(context,error,step){stopElapsedClock();setScreen('ACTION NEEDED',`${context} could not be completed.`,`The process stopped at: ${step||'Unknown step'}.`, `<div class="error-panel"><h2>What went wrong</h2><p>${escapeHtml(error.message||error)}</p><h3>What you can do next</h3><ul><li>Check that the file is a valid Excel workbook.</li><li>Confirm the required columns are present and mapped correctly.</li><li>If the file is very large, close other Excel sessions and try again.</li><li>If this repeats, contact support with the failed step shown above.</li></ul><div class="button-row">${btn('Try again','retry',true)}${btn('Back to upload','backUpload',false)}</div></div>`);$('retry').onclick=()=>state.base?showRules():showUpload();$('backUpload').onclick=showUpload}

function showWelcome(){state.step=0;setScreen('WELCOME','Welcome to your guided NPS analysis.','I will be your assistant throughout this analysis process. We will start in the Analysis Engine, move into the Analysis Review Dashboard after the run, and open the Detailed Dashboard when you are ready for the visual view.',`<section class="welcome-hero"><div class="welcome-bot-card"><div class="welcome-bot-orbit" aria-hidden="true"><strong>NI</strong></div><div><span class="eyebrow">GUIDED ANALYSIS</span><h2>Let us set up the run carefully.</h2><p>I will guide you step by step, help you make informed choices, and stay available whenever you need support. First we will upload the Base File and prepare the analysis safely on this computer.</p><div class="button-row"><button class="btn primary" id="beginGuidedAnalysis" type="button">Start with Base File</button></div></div></div></section>`);guideSay('Welcome. I will guide you through the Analysis Engine first. Once analysis is complete, I will take you to the Analysis Review Dashboard and then help you open the Detailed Dashboard when you need the visual view.','success','#beginGuidedAnalysis');beginGuidedAnalysis.onclick=()=>$('baseInput')?.click()}function showUpload(){state.step=0;setScreen("LET'S BEGIN",'Start with your Base File.','Upload the survey workbook that contains one row per customer response. I will read its structure locally and guide every decision from there.',`<div class="action-panel"><div class="upload-zone"><div class="upload-icon" aria-hidden="true">&uarr;</div><div><strong>Base File</strong><p>Excel workbook (.xlsx or .xls). Your file remains on this computer and is processed by the local analyzer.</p></div></div><div class="button-row">${btn('Choose Base File','chooseBase')}</div><div id="uploadStatus"></div></div>`);$('chooseBase').onclick=()=>$('baseInput').click()}
function sheetPreviewTable(payload){
  const rows=payload.previewRows||[],columns=(payload.columns||[]).filter(column=>column!=='__row_id');
  const meta=`${Number(payload.rows||0).toLocaleString()} rows | ${Number(payload.columnCount||columns.length||0).toLocaleString()} columns`;
  if(!rows.length||!columns.length)return `<div class="live-note"><strong>${escapeHtml(payload.sheetName||'Worksheet')}</strong><br>${escapeHtml(meta)}. No preview rows were found in this sheet.</div>`;
  return `<div class="live-note"><strong>${escapeHtml(payload.sheetName||'Worksheet')}</strong><br>${escapeHtml(meta)}. Showing first ${rows.length} rows. Scroll left to right to inspect all columns.</div><div class="sheet-preview-scroll"><table class="evidence-table sheet-preview-table"><thead><tr>${columns.map(column=>`<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(column=>`<td>${escapeHtml(row[column]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
async function previewSelectedSheet(kind,file,data){
  const select=$('sheetSelect'),root=$('sheetPreview');
  if(!select||!root)return;
  const sheetName=select.value;
  root.innerHTML='<div class="live-note">Loading preview...</div>';
  try{
    const payload=await post('/api/upload/sheet-preview',{kind,name:file.name,data,sheetName});
    root.innerHTML=sheetPreviewTable(payload);
  }catch(error){
    root.innerHTML=`<div class="error-panel"><h2>Preview unavailable</h2><p>${escapeHtml(error.message||error)}</p></div>`;
  }
}
function showSheetSelection(kind,file,data,sheetNames,start){
  stopElapsedClock();
  const label=kind==='base'?'Base File':'Lookup File';
  const sheetOptions=(sheetNames||[]).map(name=>`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
  setScreen('SELECT WORKSHEET',`Choose the ${label} sheet.`,`This workbook contains multiple sheets. Preview a worksheet, then select the one that contains the ${kind==='base'?'survey records':'lookup attributes'} you want to use.`, `<div class="action-panel"><div class="field-row"><label>Worksheet (${kind==='base'?'Base':'Lookup'})</label><select id="sheetSelect">${sheetOptions}</select></div><div class="button-row">${btn('Preview sheet','previewSheet',false)}${btn('Use selected sheet','confirmSheet',true)}${btn('Choose another file','backSheet',false)}</div><div id="sheetPreview" class="sheet-preview-panel"><div class="live-note">Select a worksheet and click Preview sheet to inspect the first rows.</div></div></div>`);
  $('previewSheet').onclick=()=>previewSelectedSheet(kind,file,data);
  $('sheetSelect').onchange=()=>{$('sheetPreview').innerHTML='<div class="live-note">Click Preview sheet to inspect this worksheet.</div>'};
  $('confirmSheet').onclick=()=>upload(kind,file,$('sheetSelect').value,data);
  $('backSheet').onclick=()=>kind==='base'?showUpload():showLookup();
}
async function upload(kind,file,selectedSheet='',cachedData=null){if(!file)return;const start=Date.now(),uploadId=`next-${Date.now()}`;setScreen('PROCESSING YOUR FILE','Opening File...','I will keep you informed while the workbook is uploaded, validated, read, profiled, and prepared for the next step.',progressShell('upload',file));startElapsedClock(start);renderStageList(uploadStages,'Uploading file');let lastStage='Uploading file';try{updateProcessView({pct:2,stage:'Uploading file',message:selectedSheet?`Preparing selected worksheet: ${selectedSheet}`:'Starting browser read and local transfer...',status:'Starting',rows:'Pending',eta:'Calculating'});let data=cachedData;if(!data){data=await readDataUrl(file,(loaded,total)=>{const pct=Math.max(3,Math.min(45,Math.round(loaded/Math.max(total,1)*45)));lastStage='Uploading file';renderStageList(uploadStages,lastStage);updateProcessView({pct,stage:lastStage,message:`Upload progress: ${fileSize(loaded)} / ${fileSize(total||file.size)} read in the browser.`,status:'Uploading',rows:'Pending',eta:processEta(start,pct),note:'Please do not refresh or close the page.'})})}else{updateProcessView({pct:45,stage:lastStage,message:'Using the workbook already loaded in the browser.',status:'Uploading',rows:'Pending',eta:processEta(start,45),note:'Please do not refresh or close the page.'})}lastStage='Validating file format';renderStageList(uploadStages,lastStage);updateProcessView({pct:50,stage:lastStage,message:'Upload transferred. The local analyzer is validating that this is a readable Excel workbook.',status:'Validating',rows:'Pending',eta:processEta(start,50),note:'Your data is being validated.'});lastStage='Reading worksheet';renderStageList(uploadStages,lastStage);updateProcessView({pct:62,stage:lastStage,message:selectedSheet?`Opening worksheet: ${selectedSheet}`:'Opening the workbook and checking available worksheets. Large files may remain here for a few minutes.',status:'Reading workbook',rows:'Pending',eta:processEta(start,62),note:'Large files may take a few minutes. We are still processing your file.'});const request={kind,name:file.name,data,uploadId};if(selectedSheet)request.sheetName=selectedSheet;const payload=await post('/api/upload',request);if(payload.needsSheetSelection){lastStage='Select worksheet';renderStageList(uploadStages,lastStage);updateProcessView({pct:82,stage:lastStage,message:`Detected ${payload.sheetCount||payload.sheetNames?.length||0} worksheets. Waiting for your selection.`,status:'Action needed',rows:'Pending',eta:'Waiting',note:'Select the worksheet to continue.'});await wait(250);showSheetSelection(kind,file,data,payload.sheetNames||[],start);return}const totalRows=Number(payload.rows||0);lastStage='Detecting sheets and columns';renderStageList(uploadStages,lastStage);updateProcessView({pct:84,stage:lastStage,message:`Detected ${payload.columns?.length||0} columns and ${totalRows.toLocaleString()} rows${payload.selectedSheet?` on ${payload.selectedSheet}`:''}. Now checking blanks, unique values, and likely mappings.`,status:'Profiling columns',rows:`${totalRows.toLocaleString()} / ${totalRows.toLocaleString()}`,eta:processEta(start,84),note:'We are checking row count, columns, blanks, and unique values.'});const model={file,rows:payload.rows,columns:payload.columns||[],stats:payload.columnStats||{},guesses:payload.guesses||{},processingTime:fmtTime((Date.now()-start)/1000),sheetCount:payload.sheetCount||payload.sheetNames?.length||1,sheetNames:payload.sheetNames||[],selectedSheet:payload.selectedSheet||selectedSheet||'',warnings:uploadWarnings(payload.columnStats||{})};lastStage='Finalizing results';renderStageList(uploadStages,lastStage);updateProcessView({pct:100,stage:lastStage,message:`Upload completed successfully. ${totalRows.toLocaleString()} rows are ready.`,status:'Complete',rows:`${totalRows.toLocaleString()} / ${totalRows.toLocaleString()}`,eta:'Complete',note:'Upload completed successfully. Preparing the next step.'});await wait(350);stopElapsedClock();if(kind==='base'){state.base=model;state.mapping={...model.guesses};showUploadComplete()}else{state.lookup=model;showLookupReady()}}catch(e){showProcessError('Upload',e,lastStage)}}
function uploadWarnings(stats){const warnings=[];for(const [column,profile] of Object.entries(stats||{})){const blanks=Number(profile.totalBlanks||0),total=Number(profile.totalEntries||0);if(total&&blanks/total>.5)warnings.push(`${column}: ${Math.round(blanks/total*100)}% blank`)}return warnings.slice(0,4)}
function showUploadComplete(){
  state.step=1;
  const b=state.base;
  const warnings=(b.warnings||[]);
  const size=b.rows>=50000?'Large file ready. Deeper statistical analysis may take a few minutes.':b.rows>=5000?'Healthy mid-sized file ready for reliable comparisons.':'Compact file ready. I will be careful with small-sample conclusions.';
  const workbookLabel=(b.file?.name||'Workbook').replace(/\.[^.]+$/,'');
  const metrics=[
    ['Total rows processed',b.rows.toLocaleString(),'rows','Within expected range'],
    ['Processing time',b.processingTime||'Recorded','time','Fast processing'],
    ['Warnings found',warnings.length?warnings.length:'0','warnings',warnings.length?'Review warnings':'Clean dataset'],
    ['Workbook',workbookLabel,'workbook',`${b.rows.toLocaleString()} rows | ${b.columns.length} fields`],
    ['Sheets detected',b.sheetCount||1,'sheets','All sheets processed'],
    ['Fields detected',b.columns.length,'fields','All fields recognized']
  ];
  setScreen('UPLOAD COMPLETED SUCCESSFULLY','Great, your Base File is ready.',`${b.rows.toLocaleString()} rows and ${b.columns.length} columns were processed successfully. ${size}`,
  `<section class="file-ready-dashboard"><div class="file-ready-success"><div class="file-ready-check" aria-hidden="true"></div><div><strong>File processed successfully in ${escapeHtml(b.processingTime||'recorded time')}.</strong><span>No blocking issues found. Your data is ready for the next step.</span></div></div><div class="file-ready-grid">${metrics.map(([label,value,type,note])=>`<article class="ready-metric-card ${type}"><div class="ready-card-icon" aria-hidden="true"></div><div class="ready-card-body"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div></article>`).join('')}</div>${warnings.length?`<div class="warning-list"><strong>Warnings</strong><ul>${warnings.map(w=>`<li>${escapeHtml(w)}</li>`).join('')}</ul></div>`:''}</section>`);
  $('continue').onclick=showCoverage
}
function showCoverage(){state.step=2;setScreen('ONE QUICK CHECK','Does the Base File already have all required fields?','You need a score or NPS result, a response date for trends, and the business fields you want to compare. Feedback text is optional unless you plan to use sentiment or themes.',`<div class="choice-grid coverage-choice-grid"><button class="choice decision-choice yes-choice" id="complete"><span class="choice-motion" aria-hidden="true"><i></i><i></i><i></i></span><strong>Yes, everything is included</strong><span>Continue directly to column mapping.</span></button><button class="choice decision-choice enrich-choice" id="lookup"><span class="choice-motion" aria-hidden="true"><i></i><i></i><i></i></span><strong>No, I need to enrich it</strong><span>Add a lookup file and connect both files using a unique key.</span></button></div>`);$('complete').onclick=()=>{state.coverage='complete';showMapping()};$('lookup').onclick=()=>{state.coverage='lookup';showLookup()}}
function showLookup(){state.step=2;setScreen('ENRICH THE BASE FILE','Add the lookup file.','I will connect it to the Base File using a unique key that exists in both workbooks, such as Case ID, Agent ID, or Employee ID.',`<div class="action-panel"><div class="upload-zone"><div class="upload-icon">+</div><div><strong>Lookup File</strong><p>Upload the workbook that contains the missing attributes.</p></div></div><div class="compact-action-row">${btn('Choose Lookup File','chooseLookup')}</div></div>`);$('chooseLookup').onclick=()=>$('lookupInput').click()}
function lookupSheetPreviewTable(label,rows,columns,keyColumn,sheetName,totalRows){
  const allColumns=(columns||[]).filter(column=>column&&column!=='__row_id');
  const visible=[keyColumn,...allColumns.filter(column=>column!==keyColumn)].filter(Boolean).slice(0,8);
  const previewRows=(rows||[]).slice(0,8);
  const sheetText=sheetName?` | Sheet: ${sheetName}`:'';
  if(!previewRows.length||!visible.length)return `<section class="dataset-section"><h3>${escapeHtml(label)}</h3><div class="live-note">${Number(totalRows||0).toLocaleString()} rows${sheetText?escapeHtml(sheetText):''}. No preview rows available.</div></section>`;
  return `<section class="dataset-section"><h3>${escapeHtml(label)}</h3><div class="live-note"><strong>${escapeHtml(keyColumn||'No key selected')}</strong><br>${Number(totalRows||previewRows.length).toLocaleString()} rows${sheetText?escapeHtml(sheetText):''}. Showing first ${previewRows.length} rows with the selected key first.</div><div class="results-table-wrap"><table class="evidence-table"><thead><tr>${visible.map(column=>`<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${previewRows.map(row=>`<tr>${visible.map(column=>`<td>${escapeHtml(row[column]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
async function renderKeyPreview(){
  const root=$('keyPreview');
  if(!root)return;
  const baseKey=$('baseKey')?.value||'',lookupKey=$('lookupKey')?.value||'';
  root.innerHTML='<div class="live-note">Loading selected sheet previews...</div>';
  try{
    const response=await fetch('/api/statistics-data',{cache:'no-store'});
    const payload=await response.json();
    if(!response.ok||!payload.ok)throw new Error(payload.error||'Could not load sheet preview.');
    root.innerHTML=`<div class="dataset-summary">${lookupSheetPreviewTable('Base selected sheet',payload.baseRows||[],payload.baseColumns||state.base?.columns||[],baseKey,state.base?.selectedSheet||'',payload.rowCounts?.baseRows||state.base?.rows||0)}${lookupSheetPreviewTable('Lookup selected sheet',payload.lookupRows||[],payload.lookupColumns||state.lookup?.columns||[],lookupKey,state.lookup?.selectedSheet||'',payload.rowCounts?.lookupRows||state.lookup?.rows||0)}</div>`;
  }catch(error){
    root.innerHTML=`<div class="error-panel"><h2>Preview unavailable</h2><p>${escapeHtml(error.message||error)}</p></div>`;
  }
}
function showLookupReady(){const baseOpts=options(state.base.columns);const lookupOpts=options(state.lookup.columns);setScreen('LOOKUP READY','How should I connect the two files?','Select the unique key in each file. Preview both selected sheets before confirming, so you do not need to open Excel.',`<div class="mapping-grid"><div class="field-row"><label>Unique key in Base File</label><select id="baseKey">${baseOpts}</select></div><div class="field-row"><label>Unique key in Lookup File</label><select id="lookupKey">${lookupOpts}</select></div></div><div class="analysis-log-path"><span>Selected sheet previews</span><div id="keyPreview"></div></div>`);$('baseKey').onchange=renderKeyPreview;$('lookupKey').onchange=renderKeyPreview;renderKeyPreview();$('confirmKeys').onclick=()=>{state.mapping.baseKey=$('baseKey').value;state.mapping.lookupKey=$('lookupKey').value;showMapping()}}
function options(cols,selected=''){return `<option value="">Not mapped</option>`+cols.map(c=>`<option ${c===selected?'selected':''}>${escapeHtml(c)}</option>`).join('')}
function weekStartOptions(selected='Sun'){return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day=>`<option value="${day}" ${day===selected?'selected':''}>${day}</option>`).join('')}
function fiscalMonthOptions(selected=1){return ['January','February','March','April','May','June','July','August','September','October','November','December'].map((month,index)=>`<option value="${index+1}" ${Number(selected)===index+1?'selected':''}>${month}</option>`).join('')}
function lookupOutputColumnName(column){
  const baseColumns=state.base?.columns||[],lookupKey=state.mapping.lookupKey||'';
  if(!state.lookup||column===lookupKey&&lookupKey===state.mapping.baseKey)return column;
  return baseColumns.includes(column)&&column!==lookupKey?`${column}_Lookup`:column;
}
function analysisColumns(){
  const baseColumns=state.base?.columns||[];
  if(!state.lookup||!state.mapping.baseKey||!state.mapping.lookupKey)return baseColumns;
  const merged=[...baseColumns];
  for(const column of state.lookup.columns||[]){
    const output=lookupOutputColumnName(column);
    if(output===state.mapping.baseKey)continue;
    if(!merged.includes(output))merged.push(output);
  }
  return merged;
}
function analysisStats(){
  const stats={...(state.base?.stats||{})};
  if(state.lookup&&state.mapping.baseKey&&state.mapping.lookupKey){
    for(const [column,profile] of Object.entries(state.lookup.stats||{})){
      const output=lookupOutputColumnName(column);
      if(!stats[output])stats[output]=profile;
    }
  }
  return stats;
}function guess(name){const g=state.base.guesses||{};return g[name]||''}
function bestMap(name){const priorities={feedback:['Verbatim','Verbatim Feedback','Feedback','Comment','Comments'],score:['Score','NPS Score','NPS','Rating','NPS Score'],satisfaction:['NPSLevel','NPS Level','NPS Type','NPS Category'],date:['CallDateTime','Feedback Date','Response Date','Date'],agent:['AgentName','Agent Name','Agent'],manager:['ManagerName','Manager/TL','Manager','Team'],wave:['Wave','Period'],tenure:['Tenure']}[name]||[];const columns=analysisColumns();const stats=analysisStats();for(const preferred of priorities){const found=columns.find(column=>column.toLowerCase()===preferred.toLowerCase());if(found){const profile=stats[found]||{};const populated=Number(profile.totalEntries||0)-Number(profile.totalBlanks||0);if(populated>0||!profile.totalEntries)return found}}const guessed=guess(name);const profile=stats[guessed]||{};return guessed&&Number(profile.totalEntries||0)>Number(profile.totalBlanks||0)?guessed:''}
async function owlModelManifest(){
  if(state.owlModels)return state.owlModels;
  try{
    const payload=await post('/api/model/list',{kind:'theme'});
    state.owlModels=Array.isArray(payload.models)?payload.models:[];
  }catch(error){state.owlModels=[]}
  return state.owlModels;
}
function owlModelDescription(model){
  const outputs=(model.outputs||['Theme','ACPT','Resolution Status']).join(', ');
  const labels=(model.labels||[]).slice(0,14).join(', ') || 'Labels from training data';
  const rows=model.trainedRows?Number(model.trainedRows).toLocaleString():'Not recorded';
  const accuracy=Number.isFinite(Number(model.accuracy))?`${fmt(Number(model.accuracy)*100)}%`:'Not recorded';
  const macro=Number.isFinite(Number(model.macroF1))?`${fmt(Number(model.macroF1)*100)}%`:'Not recorded';
  return `Model: ${model.name||'Owl custom model'}\n\nInput expected:\nCustomer verbatim / feedback text.\n\nOutputs:\n${outputs}\n\nTraining details:\nRows used: ${rows}\nAccuracy: ${accuracy}\nMacro F1: ${macro}\n\nTheme labels:\n${labels}\n\nPath:\n${model.path||''}`;
}
function showOwlModelInfo(model){
  if(!model)return;
  alert(owlModelDescription(model));
}
async function bindOwlModelSelect(){
  const pathInput=$('themeModelPath');
  if(!pathInput||$('themeModelSelect'))return;
  const models=await owlModelManifest();
  if(!models.length)return;
  const select=document.createElement('select');
  select.id='themeModelSelect';
  select.className='owl-model-select';
  select.innerHTML='<option value="">Select saved Owl model...</option>'+models.map(model=>`<option value="${escapeHtml(model.path||'')}">${escapeHtml(model.name||model.id||'Saved Owl model')}</option>`).join('');
  pathInput.parentElement?.insertBefore(select,pathInput);
  select.onchange=()=>{
    const model=models.find(item=>String(item.path||'')===select.value);
    if(model){
      pathInput.value=model.path||pathInput.value;
      showOwlModelInfo(model);
    }
  };
  pathInput.addEventListener('focus',()=>{
    const model=models.find(item=>String(item.path||'').toLowerCase()===String(pathInput.value||'').toLowerCase());
    if(model)showOwlModelInfo(model);
  },{once:true});
}
function mappedColumnLike(column,mapped){const normalized=String(column||'').toLowerCase().replace(/_lookup$/,'');return [...mapped].some(value=>{const text=String(value||'').toLowerCase();return normalized===text||String(column||'').toLowerCase()===`${text}_lookup`})}
function profileUniqueCount(profile){const numeric=Number(profile?.unique??profile?.uniqueCount??profile?.distinctValues??profile?.distinctCount??profile?.cardinality);if(Number.isFinite(numeric)&&numeric>0)return numeric;const arrays=[profile?.uniqueValues,profile?.sampleValues,profile?.samples,profile?.topValues,profile?.values,profile?.examples];for(const values of arrays){if(Array.isArray(values)&&values.length)return new Set(values.map(item=>typeof item==='object'&&item?item.value??item.name??item.label??JSON.stringify(item):item).filter(item=>String(item??'').trim())).size}return 0}
function setupDimensionCandidates(){const columns=analysisColumns(),stats=analysisStats(),mapped=new Set(Object.values(state.mapping||{}).filter(Boolean)),bad=/\b(id|case|conversation|comment|feedback|verbatim|text|description|email|phone|mobile|date|time|score|rating|nps|csat|sentiment|probability|confidence)\b/i,identity=/\b(agent|employee|advisor|representative|customer|case|conversation)\b.*\b(name|id)\b|\b(name|id)\b.*\b(agent|employee|advisor|representative|customer|case|conversation)\b/i,preferred=/location|site|region|country|market|city|state|channel|product|queue|lob|language|segment|type|tier|brand|business|department|workgroup|team|manager|supervisor|stream|batch|experience/i;return columns.map(column=>{const profile=stats[column]||{},total=Number(profile.totalEntries||profile.total||profile.count||state.base?.rows||0),blank=Number(profile.totalBlanks||profile.blankCount||profile.blanks||profile.missing||0),unique=profileUniqueCount(profile),fill=total?Math.max(0,(total-blank)/total*100):100,isMapped=mappedColumnLike(column,mapped),isPreferred=preferred.test(column),isIdentity=identity.test(column),tooMany=unique>0&&unique>Math.max(60,total*.4),score=(isPreferred?40:0)+Math.min(fill,45)+(unique>1?20:isPreferred?10:0)-(bad.test(column)?90:0)-(isIdentity?90:0)-(isMapped?60:0)-(tooMany?45:0);return{field:column,fill,unique,tooMany,score,recommended:score>=45&&fill>=20&&!isMapped&&!bad.test(column)&&!isIdentity&&(unique>1)}}).filter(item=>item.score>15&&item.fill>=10&&item.unique>1&&!item.tooMany&&!mappedColumnLike(item.field,mapped)&&!bad.test(item.field)&&!identity.test(item.field)).sort((a,b)=>b.score-a.score||a.field.localeCompare(b.field)).slice(0,40)}
function defaultCustomDimensions(candidates){const preferred=candidates.filter(item=>item.recommended).slice(0,12).map(item=>item.field);return preferred.length?preferred:candidates.slice(0,8).map(item=>item.field)}
function showCustomDimensions(){state.step=4;const candidates=setupDimensionCandidates();if(!state.customDimensions?.length)state.customDimensions=defaultCustomDimensions(candidates);const selected=new Set(state.customDimensions||[]);setScreen('CUSTOM DIMENSIONS','Select extra dimensions for this run.','Choose optional fields such as Location, Site, Region, Channel, Product, Queue, Customer Type, or other safe categorical columns. These do not replace the basic mappings; they add flexible comparison views after analysis.',`<div class="action-panel"><div class="custom-view-summary"><strong>${candidates.length?`${candidates.length} possible dimensions found`:'No extra dimensions found'}</strong><span>Checked fields will be sent with the analysis and used in the Dimensions dashboard.</span></div><div class="button-row"><button class="btn ghost" id="selectRecommendedDimensions" type="button">Select recommended</button><button class="btn ghost" id="selectAllDimensions" type="button">Select all</button><button class="btn ghost" id="clearDimensions" type="button">Clear</button></div>${candidates.length?`<div class="dimension-checkbox-grid">${candidates.map((item,index)=>`<label class="engine-option"><input type="checkbox" data-custom-dimension="${index}" value="${escapeHtml(item.field)}" ${selected.has(item.field)?'checked':''}> <span><strong>${escapeHtml(item.field)}</strong><br><small>${item.unique.toLocaleString()} groups | ${fmt(item.fill)}% populated${item.recommended?' | recommended':''}</small></span></label>`).join('')}</div>`:'<div class="custom-empty">No safe categorical fields were found beyond the basic mappings. You can continue without custom dimensions.</div>'}</div>`);const boxes=()=>[...document.querySelectorAll('[data-custom-dimension]')];$('selectRecommendedDimensions')?.addEventListener('click',()=>{const recommended=new Set(defaultCustomDimensions(candidates));boxes().forEach(box=>box.checked=recommended.has(box.value))});$('selectAllDimensions')?.addEventListener('click',()=>boxes().forEach(box=>box.checked=true));$('clearDimensions')?.addEventListener('click',()=>boxes().forEach(box=>box.checked=false));document.querySelectorAll('#confirmCustomDimensions').forEach(button=>button.onclick=()=>{state.customDimensions=boxes().filter(box=>box.checked).map(box=>box.value);showRules()});const backButton=$('back');if(backButton)backButton.onclick=showMapping}
function updateMappingGuide(){const score=document.querySelector('[data-map="score"]')?.value||'',npsCategory=document.querySelector('[data-map="satisfaction"]')?.value||'';if(score&&npsCategory&&score===npsCategory)return guideSay('Check the two NPS outcome mappings. Both currently point to the same column, so the app cannot tell whether that field should be read as a number or as a label. Use NPS Score only for the raw 0 to 10 recommendation rating. Use NPS Category only for text labels such as Promoter, Passive, or Detractor. If this column is numeric, keep it under NPS Score and clear NPS Category unless a separate label column exists. If this column is text, keep it under NPS Category and clear NPS Score.','hint','#confirmMapping');if(score&&npsCategory)return guideSay('Both NPS Score and NPS Category are selected. This is useful only when they are two separate valid columns. NPS Score keeps the raw 0 to 10 rating for score averages, distributions, trends, rankings, and statistical evidence. NPS Category tells the app the final respondent band when the source file already has Promoter, Passive, or Detractor. If a category value is blank or not recognized, the engine falls back to the numeric score and the Business Rules thresholds. Before continuing, confirm these two dropdowns are not pointing to duplicate or conflicting fields.','hint','#confirmMapping');if(score)return guideSay('NPS Score is selected. Choose this when the field contains the raw 0 to 10 recommendation rating for each survey. This column drives NPS calculation, promoter and detractor mix, target gap, weekly and monthly trends, fiscal-quarter views, agent and manager rankings, distributions, confidence checks, and the Results interpretation. Do not map a text category field here. In Business Rules, confirm Promoter starts at and Passive starts at so the app can convert each rating into Promoter, Passive, or Detractor. A separate NPS Category is optional only when the file already has a clean label column.','hint','#confirmMapping');if(npsCategory)return guideSay('Only NPS Category is selected. Use this when the file has respondent labels such as Promoter, Passive, or Detractor but no reliable numeric 0 to 10 rating column. The app can calculate NPS and band-based results from the labels. Numeric score average, score distribution, score movement, and some statistical readouts will be limited unless a separate numeric NPS Score is mapped. Check that the category values are consistently spelled and not mixed with numbers.','hint','#confirmMapping');return guideSay('Map the NPS outcome. Select NPS Score when you have the raw 0 to 10 rating column. Select NPS Category when you have a text label column. Select both only when they are separate columns and both are meaningful. At least one outcome field is required before analysis can begin. Best practice is to map NPS Score first, then add NPS Category only if the file already provides a clean respondent label.','hint','#confirmMapping')}function showMapping(){state.step=3;const fields=[['feedback','Feedback / verbatim'],['score','NPS score'],['satisfaction','NPS category'],['date','Response date'],['agent','Agent'],['manager','Manager / team'],['wave','Wave / period'],['tenure','Tenure']];setScreen('PLEASE CONFIRM','I mapped the columns I could identify.','Review each selection once. Feedback and either a score or NPS field are required by the local engine; date, agent, and manager unlock stronger trend and people intelligence.',`<div class="mapping-grid">${fields.map(([key,label])=>`<div class="field-row"><label>${label}</label><select data-map="${key}">${options(analysisColumns(),state.mapping[key]||bestMap(key))}</select></div>`).join('')}</div>`);document.querySelectorAll('[data-map="score"],[data-map="satisfaction"]').forEach(select=>select.onchange=updateMappingGuide);updateMappingGuide();$('confirmMapping').onclick=()=>{document.querySelectorAll('[data-map]').forEach(s=>state.mapping[s.dataset.map]=s.value);if(!state.mapping.feedback){fail('Please map the feedback or comment column used by the local analysis engine.');return}if(!state.mapping.score&&!state.mapping.satisfaction){fail('Please map either a NPS score or a NPS category before continuing.');return}showCustomDimensions()};const backButton=$('back');if(backButton)backButton.onclick=showCoverage}
function showRules(){state.step=5;const sparrowPath=state.rules.sparrowPath||'models/sparrow_cnx_sentimentmodel',themeModelPath=state.rules.themeModelPath||DEFAULT_THEME_MODEL_PATH,themeAny=!!(state.rules.theme||state.rules.acpt||state.rules.resolutionStatus);setScreen('FINAL SETUP','Confirm the business rules.','These settings determine how scores become outcomes and how much evidence is required before a person or team can be ranked. Sparrow adds sentiment. Owl adds Themes, ACPT, and Resolution Status from verbatims.',`<div class="rule-grid"><div class="rule-card"><label>NPS target</label><input id="target" type="number" value="${state.rules.target}"></div><div class="rule-card"><label>Score scale</label><select id="scale"><option value="5">1 to 5</option><option value="10">1 to 10</option><option value="custom">Custom</option></select></div><div class="rule-card"><label>Promoter starts at</label><input id="satMin" type="number" value="${state.rules.satisfiedMin}"></div><div class="rule-card"><label>Passive starts at</label><input id="neutralMin" type="number" value="${state.rules.neutralMin}"></div><div class="rule-card"><label>Minimum sample for ranking</label><input id="minimumSample" type="number" min="2" max="500" value="${state.rules.minimumSample||10}"></div><div class="rule-card"><label>Week starts on</label><select id="weekStart">${weekStartOptions(state.rules.weekStart||'Sun')}</select></div><div class="rule-card"><label>Fiscal year starts in</label><select id="fiscalYearStartMonth">${fiscalMonthOptions(state.rules.fiscalYearStartMonth||1)}</select></div></div><div class="action-panel signal-insights-panel"><span class="eyebrow">OPTIONAL INTELLIGENCE ENGINES</span><div class="engine-list"><div class="engine-option engine-option-with-path"><label class="engine-choice"><input type="checkbox" id="sparrow" ${state.rules.sparrow?'checked':''}> <span><span class="engine-title-row"><strong>Sparrow sentiment</strong><a class="engine-train-button" href="/apps/sparrow-training/index.html" data-train-tool="sparrow">Train Sparrow</a></span><br><small>Select when comments have meaningful customer language and you want Positive, Neutral, or Negative tone. Skip if verbatims are mostly blank or you only need score trends.</small><em>Best for sentiment briefing, emotional risk, and QA tone checks.</em></span></label><div class="model-path-field ${state.rules.sparrow?'':'hidden'}" id="sparrowPathField"><label for="sparrowPath">Sparrow model path</label><input id="sparrowPath" type="text" value="${escapeHtml(sparrowPath)}" spellcheck="false"><small class="model-path-help">Use the default path unless your Sparrow model is stored elsewhere.</small></div></div><label class="engine-option"><input type="checkbox" id="theme" ${state.rules.theme?'checked':''}> <span><span class="engine-title-row"><strong>Owl themes</strong><a class="engine-train-button" href="/apps/theme-model-training/index.html" data-train-tool="owl">Train Owl</a></span><br><small>Uses Owl to classify verbatims into trained business themes and drivers.</small><em>Best for explaining why scores changed and which topics need action.</em></span></label><label class="engine-option"><input type="checkbox" id="acpt" ${state.rules.acpt?'checked':''}> <span><strong>Owl ACPT</strong><br><small>Uses Owl to classify ownership as Agent, Customer, Process, or Technology where the trained model supports it.</small><em>Best for separating coaching needs from process or technology friction.</em></span></label><label class="engine-option"><input type="checkbox" id="resolutionStatus" ${state.rules.resolutionStatus?'checked':''}> <span><strong>Owl resolution status</strong><br><small>Uses Owl to classify whether the comment indicates resolved, unresolved, partially resolved, or not mentioned.</small><em>Best for finding unresolved experience risk in verbatims.</em></span></label><div class="model-path-field ${themeAny?'':'hidden'}" id="themeModelPathField"><div class="model-path-header"><label for="themeModelPath">Owl model path</label><a class="engine-train-button" href="/apps/theme-model-training/index.html" data-train-tool="owl">Train Owl</a></div><input id="themeModelPath" type="text" value="${escapeHtml(themeModelPath)}" spellcheck="false"><small class="model-path-help">Use the default path unless your trained model package is stored elsewhere.</small></div></div></div>`);$('scale').value=state.rules.scale||'10';$('scale').onchange=()=>{const v=$('scale').value;if(v==='5'){$('satMin').value=4;$('neutralMin').value=3}else if(v==='10'){$('satMin').value=9;$('neutralMin').value=7}};$('sparrow').onchange=()=>{$('sparrowPathField').classList.toggle('hidden',!$('sparrow').checked)};const syncThemeModelPath=()=>{$('themeModelPathField')?.classList.toggle('hidden',!($('theme')?.checked||$('acpt')?.checked||$('resolutionStatus')?.checked))};['theme','acpt','resolutionStatus'].forEach(id=>{$(id)?.addEventListener('change',syncThemeModelPath)});syncThemeModelPath();bindOwlModelSelect();document.querySelectorAll('.engine-train-button').forEach(link=>{link.addEventListener('mousedown',event=>{event.stopPropagation()});link.addEventListener('click',async event=>{event.preventDefault();event.stopPropagation();const tool=link.dataset.trainTool||'';if(tool==='sparrow'){window.open('/apps/sparrow-training/index.html','_blank','noopener');return}if(tool==='owl'){try{await post('/api/train/open',{kind:'theme'});}catch(error){console.warn('Could not launch Owl training app automatically.',error)}setTimeout(()=>window.open('/apps/theme-model-training/index.html','_blank','noopener'),500);}});});document.querySelectorAll('#run').forEach(button=>button.onclick=prepareAnalysisStart);const backButton=$('back');if(backButton)backButton.onclick=showCustomDimensions}
function captureRulesFromScreen(){
  state.rules={target:Number($('target')?.value)||state.rules.target||0,scale:$('scale')?.value||state.rules.scale||'10',satisfiedMin:Number($('satMin')?.value)||state.rules.satisfiedMin||9,neutralMin:Number($('neutralMin')?.value)||state.rules.neutralMin||7,minimumSample:Math.max(2,Number($('minimumSample')?.value)||state.rules.minimumSample||10),weekStart:String($('weekStart')?.value||state.rules.weekStart||'Sun'),fiscalYearStartMonth:Number($('fiscalYearStartMonth')?.value)||state.rules.fiscalYearStartMonth||1,sparrow:!!$('sparrow')?.checked,theme:!!$('theme')?.checked,acpt:!!$('acpt')?.checked,resolutionStatus:!!$('resolutionStatus')?.checked,sparrowPath:String($('sparrowPath')?.value||state.rules.sparrowPath||'models/sparrow_cnx_sentimentmodel').trim(),themeModelPath:String($('themeModelPath')?.value||state.rules.themeModelPath||DEFAULT_THEME_MODEL_PATH).trim()}
}
function selectedEngineSummary(){
  const engines=['Local NPS calculations'];
  if(state.rules.sparrow)engines.push('Sparrow sentiment');
  if(state.rules.theme)engines.push('Themes');
  if(state.rules.acpt)engines.push('ACPT');
  if(state.rules.resolutionStatus)engines.push('Resolution Status');
  return engines.join(', ')
}
function prepareAnalysisStart(){captureRulesFromScreen();state.step=6;showAnalysisReady()}
function analysisFilePreviewTable(payload){
  const rows=payload.previewRows||[],columns=(payload.columns||[]).filter(column=>column!=='__row_id').slice(0,8);
  const source=payload.usedLookup?'Merged Base + Lookup':'Base File';
  const sheetBits=[payload.baseSheet?`Base sheet: ${payload.baseSheet}`:'',payload.lookupSheet?`Lookup sheet: ${payload.lookupSheet}`:''].filter(Boolean).join(' | ');
  if(!rows.length||!columns.length)return `<div class="live-note"><strong>${escapeHtml(source)}</strong><br>${Number(payload.rows||0).toLocaleString()} rows | ${Number(payload.columnCount||0).toLocaleString()} columns. No preview rows were found.</div>`;
  return `<div class="live-note"><strong>${escapeHtml(source)}</strong><br>${Number(payload.rows||0).toLocaleString()} rows | ${Number(payload.columnCount||columns.length).toLocaleString()} columns${sheetBits?` | ${escapeHtml(sheetBits)}`:''}. Showing first ${rows.length} rows.</div><div class="results-table-wrap"><table class="evidence-table"><thead><tr>${columns.map(column=>`<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(column=>`<td>${escapeHtml(row[column]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
async function loadAnalysisFilePreview(){
  const root=$('analysisFilePreview');
  if(!root)return;
  root.innerHTML='<div class="live-note">Loading Preview analysis File...</div>';
  try{
    const payload=await post('/api/analysis-file-preview',{baseKey:state.mapping.baseKey||'',lookupKey:state.mapping.lookupKey||''});
    root.innerHTML=analysisFilePreviewTable(payload);
  }catch(error){
    root.innerHTML=`<div class="error-panel"><h2>Preview analysis File unavailable</h2><p>${escapeHtml(error.message||error)}</p></div>`;
  }
}
function showAnalysisReady(){setScreen('READY TO ANALYZE','Ready to build your NPS intelligence.','The analysis will start only after you click Start analysis on this page.',`<div class="analysis-ready-card"><div class="analysis-ready-intro"><span class="eyebrow">PRE-FLIGHT CHECK</span><strong>Everything needed for this run is ready.</strong><p>Selected engines: ${escapeHtml(selectedEngineSummary())}.</p></div><div class="analysis-ready-grid"><div><span>1</span><p>The analysis runs locally on this system.</p></div><div><span>2</span><p>Keep this window open until the run is complete.</p></div><div><span>3</span><p>I will show progress, rows processed, elapsed time, and ETA.</p></div><div><span>4</span><p>Sparrow, Themes, ACPT, or Resolution Status may add processing time when selected.</p></div><div><span>5</span><p>A run log will be generated for review if anything fails.</p></div></div><div class="analysis-log-path analysis-preview-block"><span>Preview analysis File</span><div id="analysisFilePreview"><div class="live-note">Loading Preview analysis File...</div></div></div><div class="analysis-log-path"><span>Run log folder</span><code>&lt;App Folder&gt;\logs\analysis_runs\</code><small>Session logs, when enabled, are stored under <code>&lt;App Folder&gt;\logs\sessions\</code>.</small></div></div>`);document.querySelectorAll('#startConfirmed').forEach(button=>button.onclick=beginAnalysisHandoff);loadAnalysisFilePreview()}
async function beginAnalysisHandoff(){setScreen('STARTING ANALYSIS','Starting your analysis now.','I am locking the setup, creating the run log, and then I will open the live progress screen.',`<div class="analysis-handoff-card"><div class="handoff-orbit"><span></span><strong>CI</strong></div><div class="handoff-copy"><span class="eyebrow">LOCAL ENGINE HANDOFF</span><h2 id="handoffTitle">Locking the setup</h2><p id="handoffText">I am freezing the confirmed mappings, score rules, and selected engines for this run. The live progress screen will open automatically.</p><div class="handoff-steps"><span class="active">Locking setup</span><span>Creating run log</span><span>Starting analysis</span></div></div></div>`);guideSay('I am locking the setup, creating the run log, and handing the job to the local engine. The live progress page will open next.','working');const titles=['Locking the setup','Creating the run log','Starting local analysis'],messages=['I am freezing the confirmed mappings, score rules, and selected engines for this run.','I am preparing the run log so this analysis can be reviewed later if needed.','I am handing the job to the local engine and opening the live progress screen.'];for(let i=0;i<titles.length;i++){if($('handoffTitle'))$('handoffTitle').textContent=titles[i];if($('handoffText'))$('handoffText').textContent=messages[i];document.querySelectorAll('.handoff-steps span').forEach((el,index)=>el.classList.toggle('active',index<=i));await wait(1100)}runAnalysis()}
async function runAnalysis(){state.step=6;showAnalysis();try{const payload={mode:'nps',mapping:{feedback:state.mapping.feedback||'',score:state.mapping.score||'',satisfaction:state.mapping.satisfaction||'',agent:state.mapping.agent||'',manager:state.mapping.manager||'',date:state.mapping.date||'',wave:state.mapping.wave||'',tenure:state.mapping.tenure||''},npsBands:{scale:state.rules.scale,promoterMin:state.rules.satisfiedMin,passiveMin:state.rules.neutralMin},engines:{sentiment:state.rules.sparrow?'sparrow':'local',theme:(state.rules.theme||state.rules.acpt||state.rules.resolutionStatus)?'theme':'local'},modelPaths:{sparrow:state.rules.sparrow?state.rules.sparrowPath:'',theme:(state.rules.theme||state.rules.acpt||state.rules.resolutionStatus)?state.rules.themeModelPath:''},modelOutputs:{theme:!!state.rules.theme,acpt:!!state.rules.acpt,resolutionStatus:!!state.rules.resolutionStatus},dynamicDimensions:state.customDimensions||[],calendar:{weekStart:state.rules.weekStart||'Sun',fiscalYearStartMonth:state.rules.fiscalYearStartMonth||1},baseKey:state.mapping.baseKey||'',lookupKey:state.mapping.lookupKey||''};const started=await post('/api/analyze',payload);await pollAnalysis(started.analysisId||started.analysis?.analysisId||'')}catch(e){showProcessError('Analysis',e,'Processing records')}}
function ledgerQuestions(){return questions.map((q,i)=>({title:q[0],detail:q[1],number:i+1})).concat(sentimentQuestions.map((q,i)=>({title:q[1],detail:q[3]||q[2]||'Sentiment evidence and guardrail',number:questions.length+i+1,sentiment:true})))}
function showAnalysis(){state.analysisStartedAt=Date.now();const ledger=ledgerQuestions();setScreen('ANALYSIS IN PROGRESS','I am building the evidence, one question at a time.','The local engine is validating fields, processing rows, generating summaries, and preparing output. I will show the current stage, row progress, elapsed time, and ETA where possible.',`<div class="progress-layout"><section class="progress-panel wide-progress">${progressShell('analysis',state.base?.file)}</section><section class="question-ledger"><header><h2>Leadership question ledger</h2><span id="answerCount">0 / ${ledger.length} answered</span></header><div class="ledger-list" id="ledgerList">${ledger.map((q,i)=>`<article class="ledger-item" id="q${i}"><span class="ledger-status">${q.number}</span><div><strong>${escapeHtml(q.title)}</strong><p>${escapeHtml(q.detail)}</p></div><small>Queued</small></article>`).join('')}</div></section></div>`);startElapsedClock(state.analysisStartedAt);renderStageList(analysisStages,'Validating required fields');updateProcessView({pct:1,stage:'Validating required fields',message:'Starting the local analysis engine...',status:'Starting',rows:`0 / ${(state.base?.rows||0).toLocaleString()}`,eta:'Calculating',note:'Please do not refresh or close the page.'})}
async function pollAnalysis(id){let done=false;while(!done){await wait(900);const r=await fetch('/api/analysis/progress',{cache:'no-store'});const p=await r.json();const backendPct=Number(p.progress||0);const pct=Math.min(88,Math.round(backendPct*.88));const message=p.status||'Analyzing rows';setProgress(pct,message);if(p.error)throw new Error(`Analysis failed during ${friendlyStage(message,pct)}: ${p.error}`);done=!p.running&&Number(p.progress)>=100}setProgress(90,'Generating summary: calculating the 100 leadership questions and evidence tables.');const r=await fetch('/api/status',{cache:'no-store'});const payload=await r.json();state.analysis=payload.analysis||{};await answerQuestions();state.analysisProcessingTime=fmtTime((Date.now()-(state.analysisStartedAt||Date.now()))/1000);stopElapsedClock();showAnalysisCompleteAnimation()}
function setProgress(pct,message){const rowInfo=parseRows(message);const total=rowInfo?.total||state.base?.rows||0;const done=rowInfo?rowInfo.done:Math.round((Number(pct)||0)/100*total);const stage=friendlyStage(message,pct);renderStageList(analysisStages,stage);updateProcessView({pct,stage,message,status:pct>=100?'Complete':'Running',rows:total?`${Math.min(done,total).toLocaleString()} / ${total.toLocaleString()}`:'Calculating',eta:processEta(state.analysisStartedAt||Date.now(),pct),note:reassurance(message,pct,total)});if($('analysisStage'))$('analysisStage').textContent=stage;if($('analysisMessage'))$('analysisMessage').textContent=message}
async function answerQuestions(){let rigorous=[];const total=questions.length+sentimentQuestions.length;state.answers=[];state.sentimentAnswers=[];try{const payload=await post('/api/leadership-statistics',{mode:'nps',target:state.rules.target,minimumSample:state.rules.minimumSample,promoterMin:state.rules.satisfiedMin,passiveMin:state.rules.neutralMin,calendar:{weekStart:state.rules.weekStart||'Sun',fiscalYearStartMonth:state.rules.fiscalYearStartMonth||1}});rigorous=payload.questions||[]}catch(error){console.warn('NPS rigorous statistics endpoint unavailable; using aggregate fallback.',error)}for(let i=0;i<questions.length;i++){const el=$('q'+i);el.classList.add('running');el.querySelector('small').textContent='Calculating';el.scrollIntoView({block:'nearest',behavior:'smooth'});await wait(75);const answer=rigorous[i]||{question:questions[i][0],...calculateAnswer(i,state.analysis),method:'Aggregate fallback',status:'Directional'};state.answers.push(answer);el.classList.remove('running');el.classList.add('done');el.querySelector('.ledger-status').textContent='\u2713';el.querySelector('p').textContent=answer.text;el.querySelector('small').textContent=answer.status||'Answered';$('answerCount').textContent=`${i+1} / ${total} answered`;setProgress(88+Math.round((i+1)/total*12),`Answering: ${questions[i][0]}`)}state.sentimentAnswers=buildSentimentAnswers();for(let i=0;i<state.sentimentAnswers.length;i++){const ledgerIndex=questions.length+i,el=$('q'+ledgerIndex),answer=state.sentimentAnswers[i];if(!el)continue;el.classList.add('running');el.querySelector('small').textContent='Calculating';el.scrollIntoView({block:'nearest',behavior:'smooth'});await wait(35);el.classList.remove('running');el.classList.add('done');el.querySelector('.ledger-status').textContent='\u2713';el.querySelector('p').textContent=answer.text;el.querySelector('small').textContent=answer.status||'Answered';$('answerCount').textContent=`${ledgerIndex+1} / ${total} answered`;setProgress(88+Math.round((ledgerIndex+1)/total*12),`Answering: ${answer.question}`)} }
function calculateAnswer(i,a){const summary=a.summary||{},weekly=a.weekly||[],agents=a.agents||[],managers=a.managers||[];const overall=num(summary.NPS??summary.nps);const target=state.rules.target;const sort=(rows,key)=>rows.map(r=>({name:nameOf(r),value:num(r[key]??r.NPS),responses:num(r.Responses)})).filter(x=>Number.isFinite(x.value)).sort((x,y)=>y.value-x.value);const ar=sort(agents,'Agent NPS'),mr=sort(managers,'Manager NPS'),wr=weekly.map(r=>({name:String(r.Week||''),value:num(r.NPS),responses:num(r.Responses)})).filter(x=>Number.isFinite(x.value));const latest=wr.at(-1),prev=wr.at(-2),mean=avg(wr.map(x=>x.value)),sd=std(wr.map(x=>x.value));const generic=[`Overall NPS is ${fmt(overall)} against target ${fmt(target)} (${signed(overall-target)} pts).`,`Weekly mean ${fmt(mean)}, standard deviation ${fmt(sd)}, across ${wr.length} periods.`,`Best: ${mr[0]?.name||'Not mapped'} ${fmt(mr[0]?.value)}; weakest: ${mr.at(-1)?.name||'Not mapped'} ${fmt(mr.at(-1)?.value)}.`,`Best: ${ar[0]?.name||'Not mapped'} ${fmt(ar[0]?.value)}; weakest: ${ar.at(-1)?.name||'Not mapped'} ${fmt(ar.at(-1)?.value)}.`];if(i===0)return{text:latest&&prev?`Latest week ${fmt(latest.value)} versus ${fmt(prev.value)}: ${signed(latest.value-prev.value)} pts. ${Math.abs(latest.value-prev.value)<1?'Stable':latest.value>prev.value?'Improving':'Declining'}.`:'A date field was not available for a reliable trend.'};if(i===1)return{text:`NPS ${fmt(overall)} from ${Number(summary.total||0).toLocaleString()} responses; weekly range ${fmt(Math.max(...wr.map(x=>x.value))-Math.min(...wr.map(x=>x.value)))} pts and SD ${fmt(sd)}.`};if(i===2||i===14||i===18||i===19||i===24||i===27)return{text:generic[2]};if(i===3||i===15||i===20||i===21||i===23||i===25||i===26)return{text:generic[3]};if([4,5,6,7,12,13,22].includes(i))return{text:latest&&prev?`Latest movement is ${signed(latest.value-prev.value)} pts; best period ${wr.sort((x,y)=>y.value-x.value)[0]?.name||'n/a'} at ${fmt(Math.max(...wr.map(x=>x.value)))}.`:'Insufficient dated periods for this calculation.'};if([8,9,10,11,16,17].includes(i))return{text:`Weekly variability is ${fmt(sd)} pts. ${sd<2?'Performance is comparatively stable.':sd<5?'Variation should be monitored.':'Variation is material and needs investigation.'}`};if(i===28)return{text:`NPS is ${signed(overall-target)} pts versus target. Latest weekly movement is ${latest&&prev?signed(latest.value-prev.value):'not available'} pts; ${agents.filter(x=>num(x.NPS)<target).length} agents are below target.`};return{text:generic[i%generic.length]}}
function conciseResult(answer){const text=String(answer.text||'No reliable answer is available.');const question=String(answer.question||'').toLowerCase();if(question.includes('trend over time')){const match=text.match(/NPS is (improving|declining|stable)/i);return match?`NPS is ${match[1].toLowerCase()} week over week.`:text.split(';')[0]+'.'}if(question.includes('overall nps')){const score=text.match(/Overall NPS is ([\d.]+)%/i)?.[1];const gap=text.match(/Target gap ([+-]?[\d.]+)/i)?.[1];return score?`Overall NPS is ${score}%${gap?`, ${Math.abs(Number(gap)).toFixed(1)} points ${Number(gap)>=0?'above':'below'} target`:''}.`:text.split(';')[0]+'.'}return text.split(/(?<=[.!?])\s/).slice(0,2).join(' ').replace(/\s*\([^)]*(?:p=|CI|n=)[^)]*\)/gi,'')}
function recommendedAction(status){const value=String(status||'').toLowerCase();if(value.includes('no action'))return'No action required';if(value.includes('action'))return'Investigate';if(value.includes('review'))return'Review';if(value.includes('monitor'))return'Monitor';return'Validate evidence'}
function mappedProfile(key){const column=state.mapping?.[key];return column&&state.base?.stats?state.base.stats[column]||{}:{}}
function profileMissing(key){const p=mappedProfile(key);return Number(p.totalBlanks||0)}
function datasetEntityRows(kind){const rows=Array.isArray(state.analysis?.[kind])?state.analysis[kind]:[];return rows.map(r=>({name:nameOf(r),responses:num(r.Responses??r.responses??r.Count??r.count),nps:num(r.NPS??r.nps??r['Agent NPS']??r['Manager NPS'])})).filter(r=>Number.isFinite(r.responses)||Number.isFinite(r.nps))}
function datasetVolumeStats(rows,total){const counts=rows.map(r=>num(r.responses)).filter(Number.isFinite);const max=counts.length?Math.max(...counts):NaN,min=counts.length?Math.min(...counts):NaN;const avg=rows.length&&Number.isFinite(total)?total/rows.length:NaN;const ratio=Number.isFinite(max)&&Number.isFinite(min)&&min>0?max/min:NaN;const dist=!Number.isFinite(ratio)?'Needs more evidence':ratio<=2?'Even':ratio<=5?'Moderate':'Skewed';return{avg,max,min,dist}}
function datasetDateInfo(){const weekly=Array.isArray(state.analysis?.weekly)?state.analysis.weekly:[];const dates=weekly.map(r=>new Date(r.Week||r.Period||r.Date||'')).filter(d=>!Number.isNaN(d.getTime())).sort((a,b)=>a-b);const earliest=dates[0],latest=dates.at(-1);const days=earliest&&latest?Math.max(1,Math.round((latest-earliest)/86400000)+1):NaN;const weeks=weekly.length||NaN;const months=earliest&&latest?Math.max(1,(latest.getFullYear()-earliest.getFullYear())*12+latest.getMonth()-earliest.getMonth()+1):NaN;return{earliest,latest,days,weeks,months}}
function dateText(d){return d&&!Number.isNaN(d.getTime())?d.toISOString().slice(0,10):'Needs date field'}
function datasetSummaryData(){const total=num(state.analysis?.summary?.total??state.base?.rows),columns=(state.base?.columns||[]).length,stats=state.base?.stats||{},agentRows=datasetEntityRows('agents'),managerRows=datasetEntityRows('managers'),agentStats=datasetVolumeStats(agentRows,total),managerStats=datasetVolumeStats(managerRows,total),dateInfo=datasetDateInfo();const totalCells=Object.values(stats).reduce((s,p)=>s+Number(p.totalEntries||0),0),blankCells=Object.values(stats).reduce((s,p)=>s+Number(p.totalBlanks||0),0),completeness=totalCells?Math.max(0,100-(blankCells/totalCells*100)):NaN;const weekly=Array.isArray(state.analysis?.weekly)?state.analysis.weekly:[];const weekVolumes=weekly.map(r=>({name:String(r.Week||r.Period||'Period'),responses:num(r.Responses??r.responses)})).filter(r=>Number.isFinite(r.responses));const highest=weekVolumes.length?[...weekVolumes].sort((a,b)=>b.responses-a.responses)[0]:null,lowest=weekVolumes.length?[...weekVolumes].sort((a,b)=>a.responses-b.responses)[0]:null;const sampleOk=Number.isFinite(total)&&total>=Number(state.rules.minimumSample||10);const reliability=Number.isFinite(total)?total>=500?'High':total>=100?'Medium':'Low':'Needs more evidence';const coverageRating=Number.isFinite(completeness)?completeness>=95?'Excellent':completeness>=85?'Good':completeness>=70?'Fair':'Poor':'Needs more evidence';return{total,columns,agentRows,managerRows,agentStats,managerStats,dateInfo,totalCells,blankCells,completeness,weekly,highest,lowest,sampleOk,reliability,coverageRating}}
function summaryItem(label,value){return `<div class="summary-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`}
function summarySection(title,items){return `<article class="dataset-section"><h3><span class="section-icon" aria-hidden="true"></span>${escapeHtml(title)}</h3><div class="summary-list">${items.map(([label,value])=>summaryItem(label,value)).join('')}</div></article>`}
function datasetSummaryTab(){const d=datasetSummaryData();const total=Number.isFinite(d.total)?d.total:0;const avgDay=Number.isFinite(d.dateInfo.days)&&d.dateInfo.days?total/d.dateInfo.days:NaN,avgWeek=Number.isFinite(d.dateInfo.weeks)&&d.dateInfo.weeks?total/d.dateInfo.weeks:NaN,avgMonth=Number.isFinite(d.dateInfo.months)&&d.dateInfo.months?total/d.dateInfo.months:NaN;const sections=[
 ['File Information', [['File Name',state.base?.file?.name||'Uploaded workbook'],['File Type',state.base?.file?.name?.split('.').pop()?.toUpperCase()||'Excel'],['Worksheet Name','First worksheet read by local analyzer'],['File Size',state.base?.file?.size?fileSize(state.base.file.size):'Not captured'],['Analysis Date & Time',new Date().toLocaleString()],['Analysis Duration',state.analysisProcessingTime||'Recorded during run'],['Analytics Engine Version','Krestrel Analysis Suite']]],
 ['Dataset Overview', [['Total Records Analyzed',Number.isFinite(d.total)?Math.round(d.total).toLocaleString():'Not available'],['Total Columns',d.columns.toLocaleString()],['Total Unique Agents',d.agentRows.length?d.agentRows.length.toLocaleString():'Needs agent mapping'],['Total Unique Managers',d.managerRows.length?d.managerRows.length.toLocaleString():'Needs manager mapping'],['Date Range Covered',`${dateText(d.dateInfo.earliest)} to ${dateText(d.dateInfo.latest)}`],['Total Days Covered',Number.isFinite(d.dateInfo.days)?d.dateInfo.days.toLocaleString():'Needs date field'],['Total Weeks Covered',Number.isFinite(d.dateInfo.weeks)?d.dateInfo.weeks.toLocaleString():'Needs date field'],['Total Months Covered',Number.isFinite(d.dateInfo.months)?d.dateInfo.months.toLocaleString():'Needs date field']]],
 ['Model Information - Sentiment Analysis', state.rules.sparrow?[['AI Model Used','Sparrow Sentiment'],['Model Path',state.rules.sparrowPath||DEFAULT_SPARROW_MODEL_PATH],['Model Type','Local Fine-Tuned RoBERTa Classification Model'],['Base Model','cardiffnlp/twitter-roberta-base-sentiment-latest'],['Model Package','Model 8'],['Model Weights Size','475.5 MB'],['Framework Version','Transformers 5.4.0'],['Tokenizer Version','1.0'],['Package Updated','22 June 2026, 3:46 PM'],['Training Epochs','4'],['Training Batch Size','8'],['Learning Rate','2e-5'],['Evaluation Accuracy','96.43%'],['Training Data Schema','Text column: text; label column: label'],['Number of Output Classes','3 (Positive, Neutral, Negative)']]:[['AI Model Used','Local Rules'],['Model Path','Not applicable'],['Model Type','Local rule-based engine (no AI model)'],['Number of Output Classes','3 rule-based outcomes']]],
 ['Model Information - Theme Classification', [['AI Model Used',state.rules.theme?'Owl trained model':'Local Rules'],['Model Type',state.rules.theme?'Local Fine-Tuned Multi-Class Model':'Local rule-based engine (no AI model)'],['Model Version',state.rules.theme?'Model package not available in this installation':'Not applicable'],['Model Size',state.rules.theme?'Model package not available in this installation':'Not applicable'],['Training Dataset Version',state.rules.theme?'Model package not available in this installation':'Not applicable'],['Date Last Trained',state.rules.theme?'Model package not available in this installation':'Not applicable'],['Number of Training Samples',state.rules.theme?'Model package not available in this installation':'Not applicable'],['Number of Output Classes',state.rules.theme?'Model package not available in this installation':'Rule-based theme outputs']]],
 ['Dataset Composition', [['Average Surveys per Agent',fmt(d.agentStats.avg)],['Average Surveys per Manager',fmt(d.managerStats.avg)],['Maximum Surveys for an Agent',Number.isFinite(d.agentStats.max)?Math.round(d.agentStats.max).toLocaleString():'Needs agent mapping'],['Minimum Surveys for an Agent',Number.isFinite(d.agentStats.min)?Math.round(d.agentStats.min).toLocaleString():'Needs agent mapping'],['Maximum Surveys for a Manager',Number.isFinite(d.managerStats.max)?Math.round(d.managerStats.max).toLocaleString():'Needs manager mapping'],['Minimum Surveys for a Manager',Number.isFinite(d.managerStats.min)?Math.round(d.managerStats.min).toLocaleString():'Needs manager mapping']]],
 ['Data Quality Assessment', [['Records Successfully Processed',Number.isFinite(d.total)?Math.round(d.total).toLocaleString():'Not available'],['Records Excluded',Math.max(0,(state.base?.rows||0)-total).toLocaleString()],['Duplicate Records','Not flagged by current local profile'],['Missing Values',d.blankCells.toLocaleString()],['Missing Agent Names',profileMissing('agent').toLocaleString()],['Missing Manager Names',profileMissing('manager').toLocaleString()],['Missing NPS Scores',profileMissing('score').toLocaleString()],['Missing Survey Dates',profileMissing('date').toLocaleString()],['Invalid NPS Values','Validated during NPS scoring'],['Invalid Date Formats','Invalid dates excluded from trend calculations']]],
 ['Statistical Readiness', [['Overall Sample Size',Number.isFinite(d.total)?Math.round(d.total).toLocaleString():'Not available'],['Sample Adequacy Rating',d.reliability],['Minimum Sample Threshold Met',d.sampleOk?'Yes':'No'],['Suitable for Trend Analysis',d.weekly.length>=2?'Yes':'No'],['Suitable for Agent Comparison',d.agentRows.length>=2?'Yes':'No'],['Suitable for Manager Comparison',d.managerRows.length>=2?'Yes':'No'],['Suitable for Statistical Significance Testing',d.total>=Number(state.rules.minimumSample||10)*2?'Yes':'Directional only'],['Overall Analysis Reliability',d.reliability]]],
 ['Analysis Scope', [['Primary Metric Analyzed','NPS'],['Analysis Level','Organization, agent, manager, period'],['Trend Granularity','Weekly where date is available'],['Comparison Period','Latest period versus prior period'],['Statistical Methods Applied','Wilson CI, z-test, regression, variance, dispersion, confidence-adjusted ranking'],['Confidence Level Used','95%'],['Outlier Detection Method','Z-score and IQR-style guardrails']]],
 ['Processing Summary', [['Total Calculations Performed','100 leadership questions plus dataset summary'],['Total Statistical Metrics Generated',(state.answers.length+(state.sentimentAnswers?.length||0)).toLocaleString()],['Total Leadership Questions Evaluated',(state.answers.length+(state.sentimentAnswers?.length||0)).toLocaleString()],['Total Insight Lenses Generated','5'],['Analysis Status','Completed successfully'],['Processing Completed Successfully','Yes']]],
 ['Data Coverage', [['Earliest Survey Date',dateText(d.dateInfo.earliest)],['Latest Survey Date',dateText(d.dateInfo.latest)],['Reporting Period',`${dateText(d.dateInfo.earliest)} to ${dateText(d.dateInfo.latest)}`],['Average Surveys per Day',fmt(avgDay)],['Average Surveys per Week',fmt(avgWeek)],['Average Surveys per Month',fmt(avgMonth)],['Highest Survey Volume Day / Period',d.highest?`${d.highest.name}: ${Math.round(d.highest.responses).toLocaleString()}`:'Needs date field'],['Lowest Survey Volume Day / Period',d.lowest?`${d.lowest.name}: ${Math.round(d.lowest.responses).toLocaleString()}`:'Needs date field'],['Data Coverage Rating',d.coverageRating]]],
 ['Data Coverage & Health', [['Data Completeness',Number.isFinite(d.completeness)?`${d.completeness.toFixed(1)}%`:'Needs column profile'],['Data Consistency',d.coverageRating],['Statistical Reliability',d.reliability],['Confidence in Results',d.reliability==='High'?'High':d.reliability==='Medium'?'Moderate':'Low'],['Suitable for Trend Analysis',d.weekly.length>=2?'Yes':'No'],['Suitable for Manager Comparison',d.managerRows.length>=2?'Yes':'No'],['Suitable for Agent Comparison',d.agentRows.length>=2?'Yes':'No'],['Suitable for Statistical Significance Testing',d.total>=Number(state.rules.minimumSample||10)*2?'Yes':'No'],['Overall Dataset Quality',d.coverageRating]]],
 ['Data Distribution', [['Survey Distribution Across Agents',d.agentStats.dist],['Survey Distribution Across Managers',d.managerStats.dist],['Largest Agent Sample Size',Number.isFinite(d.agentStats.max)?Math.round(d.agentStats.max).toLocaleString():'Needs agent mapping'],['Smallest Agent Sample Size',Number.isFinite(d.agentStats.min)?Math.round(d.agentStats.min).toLocaleString():'Needs agent mapping'],['Largest Manager Sample Size',Number.isFinite(d.managerStats.max)?Math.round(d.managerStats.max).toLocaleString():'Needs manager mapping'],['Smallest Manager Sample Size',Number.isFinite(d.managerStats.min)?Math.round(d.managerStats.min).toLocaleString():'Needs manager mapping']]]
 ];return `<section class="dataset-summary"><header><span class="eyebrow">DATA SET SUMMARY</span><h2>Here is the health profile of the file we analyzed.</h2><p>This summarizes file details, coverage, data quality, statistical readiness, processing status, and distribution balance before you read the results.</p></header><div class="dataset-grid">${sections.map(([title,items])=>summarySection(title,items)).join('')}</div></section>`}
function resultsInterpretation(answer){if(!answer)return'';if(hasUsableDetail(answer)&&String(answer.text||'').trim())return answer.text;return 'Use the answer, evidence status, and double-click calculation view together before making a leadership decision.'}
function resultsTable(){if(!state.sentimentAnswers?.length)state.sentimentAnswers=buildSentimentAnswers();const scoreCards=state.answers.map((a,i)=>resultReviewCard(a,i,'Score','result')).join('');const sentimentCards=state.sentimentAnswers.map((a,i)=>resultReviewCard(a,i,'Sentiment','sentiment')).join('');return `<section class="clean-results"><div class="clean-results-grid">${scoreCards}${sentimentCards}</div><p class="table-hint">Double-click any result card to view the calculation logic, statistics, guardrail, and supporting data points.</p></section>`}
function resultReviewCard(a,i,area,type){const attr=type==='sentiment'?`data-sentiment-index="${i}"`:`data-result-index="${i}"`;const number=type==='sentiment'?questions.length+(a.number||i+1):(a.number||i+1);return `<article class="clean-result-card" ${attr} title="Double-click to view the calculation"><div class="clean-result-number">${number}</div><div class="clean-result-main"><div class="clean-result-head"><span>${escapeHtml(area)}</span><strong>${escapeHtml(a.question||'Analysis question')}</strong></div><p>${escapeHtml(conciseResult(a))}</p><small>${escapeHtml(resultsInterpretation(a))}</small></div><div class="clean-result-side"><span class="status-pill">${escapeHtml(a.status||'Directional')}</span><em>${escapeHtml(recommendedAction(a.status))}</em></div></article>`}
function binaryOutcome(answer){const question=String(answer.question||'').trim();if(!/^(is|are|can|has|have|does|do|did|was|were)\b/i.test(question))return null;const text=String(answer.text||'').toLowerCase();if(/not available|insufficient|low[- ]confidence|cannot determine|no reliable|too few|not mapped/.test(text))return'uncertain';if(/not statistically|detected 0|0 (?:unusual|reliable|outlier)|no action required|not statistically distinguishable|short-term fluctuation/.test(text))return'no';if(/statistically significant|sustained signal|detected [1-9]|\bavailable\b|\bimproving\b|remained above/.test(text))return'yes';return'uncertain'}
function hasUsableDetail(answer){const text=String(answer.text||'').trim();return Boolean(text)&&!/not available|insufficient data|no reliable answer|could not calculate/i.test(text)}
function outcomeBadge(outcome){if(!outcome)return'';const config={yes:['\u2713','Yes'],no:['\u00d7','No'],uncertain:['!','Not clear']}[outcome];return `<span class="binary-badge ${outcome}" title="${config[1]}" aria-label="${config[1]}">${config[0]}</span>`}
function briefingCards(){return `<div class="results-grid">${state.answers.map((a,i)=>{const outcome=binaryOutcome(a);const detail=hasUsableDetail(a)?a.text:'No reliable evidence is available for this question with the mapped data.';return `<article class="result-card briefing-card" data-briefing-index="${i}" title="Double-click to view score interpretation"><div class="result-card-head"><span class="eyebrow">QUESTION ${a.number||i+1} &middot; ${escapeHtml(a.status||'EVIDENCE')}</span>${outcomeBadge(outcome)}</div><h3>${escapeHtml(a.question)}</h3><p>${escapeHtml(detail)}</p><footer>Double-click for score interpretation and executive readout</footer></article>`}).join('')}</div>`}
function readoutMetrics(){
 const a=state.analysis||{},summary=a.summary||{},weekly=Array.isArray(a.weekly)?a.weekly:[],agents=Array.isArray(a.agents)?a.agents:[],managers=Array.isArray(a.managers)?a.managers:[];
 const overall=num(summary.NPS??summary.nps??summary.overallNPS),total=num(summary.total??summary.Responses??summary.responses),target=num(state.rules.target);
 const periods=weekly.map(row=>({name:String(row.Week||row.Period||row.Date||''),nps:num(row.NPS??row.nps),responses:num(row.Responses??row.responses)})).filter(row=>Number.isFinite(row.nps));
 const latest=periods.at(-1),previous=periods.at(-2),movement=latest&&previous?latest.nps-previous.nps:NaN;
 const values=periods.map(row=>row.nps),sd=std(values),range=values.length?Math.max(...values)-Math.min(...values):NaN;
 const trend=Number.isFinite(movement)?Math.abs(movement)<1?'Stable':movement>0?'Improving':'Declining':'Needs more periods';
 const consistency=Number.isFinite(sd)?sd<2?'High':sd<5?'Moderate':'Low':'Needs more evidence';
 const variability=Number.isFinite(sd)?sd<2?'Remained Stable':sd<5?'Moderate':'Increased':'Needs more evidence';
 const confidence=Number.isFinite(total)?total>=500?'High':total>=100?'Moderate':'Low':'Needs more evidence';
 const outlook=Number.isFinite(overall)&&Number.isFinite(target)?overall>=target?'Positive':overall>=target-3?'Neutral':'At Risk':'Needs more evidence';
 const sortEntity=(rows,key)=>rows.map(r=>({name:nameOf(r),nps:num(r[key]??r.NPS??r.nps),responses:num(r.Responses??r.responses),trend:num(r.Movement??r.movement??r.Trend)})).filter(x=>Number.isFinite(x.nps)).sort((x,y)=>y.nps-x.nps);
 const ar=sortEntity(agents,'Agent NPS'),mr=sortEntity(managers,'Manager NPS');
 const bestAgent=ar[0],weakAgent=ar.at(-1),bestManager=mr[0],weakManager=mr.at(-1);
 const movingAgents=ar.filter(x=>Number.isFinite(x.trend)).sort((x,y)=>y.trend-x.trend),movingManagers=mr.filter(x=>Number.isFinite(x.trend)).sort((x,y)=>y.trend-x.trend);
 return {overall,total,target,gap:Number.isFinite(overall)&&Number.isFinite(target)?overall-target:NaN,trend,consistency,variability,confidence,outlook,latest,previous,movement,sd,range,periods,bestAgent,weakAgent,bestManager,weakManager,mostImprovedAgent:movingAgents[0]||bestAgent,mostDeclinedAgent:movingAgents.at(-1)||weakAgent,mostImprovedManager:movingManagers[0]||bestManager,mostDeclinedManager:movingManagers.at(-1)||weakManager};
}
function entityLine(entity,fallback){return entity?`${escapeHtml(entity.name)} (${fmt(entity.nps)} NPS${Number.isFinite(entity.responses)?`, n=${Math.round(entity.responses).toLocaleString()}`:''})`:fallback}
function insightEvidence(items){return items.filter(Boolean).map(item=>`<span>${escapeHtml(item)}</span>`).join('')}
function insightRow(item,index){return `<article class="decision-insight"><div class="decision-rank">${index+1}</div><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.finding)}</p><p class="decision-action">${escapeHtml(item.why)}</p><div class="decision-evidence">${insightEvidence(item.evidence||[])}</div></div></article>`}
function readoutReason(){const reasons=Array.isArray(state.analysis?.reasons)?state.analysis.reasons:[];const first=reasons[0]||{};const label=first['Primary Reason']||first.Reason||first.Driver||first.name||first.Name||first['Bucket Category']||'';const count=num(first.Count??first.Responses??first.Detractor_Count??first.Negative_Count);return {label:String(label||'No dominant driver available'),count}}
function readoutSentiment(){const s=state.analysis?.sentiment||{};return {positive:num(s.Positive),neutral:num(s.Neutral),negative:num(s.Negative)}}
function periodLine(period){return period?`${period.name||'Period'} at ${fmt(period.nps)} NPS${Number.isFinite(period.responses)?` (n=${Math.round(period.responses).toLocaleString()})`:''}`:'Not enough dated periods'}
function entityRaw(entity,label){return entity?`${entity.name} ${fmt(entity.nps)} NPS${Number.isFinite(entity.responses)?` (n=${Math.round(entity.responses).toLocaleString()})`:''}`:label}
const qaLensQuestionBank=[
 {
  "category": "Target Achievement",
  "number": 1,
  "question": "Which agents have the longest target achievement streak?",
  "logic": "Max consecutive periods where Agent Score >= Target.",
  "considerations": "Use all periods in selected range. Streak breaks on first miss."
 },
 {
  "category": "Target Achievement",
  "number": 2,
  "question": "Which agents have the longest missed target streak?",
  "logic": "Max consecutive periods where Agent Score < Target.",
  "considerations": "Use all periods in selected range."
 },
 {
  "category": "Trend",
  "number": 3,
  "question": "Which agents are consistently improving?",
  "logic": "Every period score >= previous period.",
  "considerations": "Evaluate entire selected range. Equal values allowed."
 },
 {
  "category": "Trend",
  "number": 4,
  "question": "Which agents are consistently declining?",
  "logic": "Every period score <= previous period.",
  "considerations": "Evaluate entire selected range. Equal values allowed."
 },
 {
  "category": "Trend",
  "number": 5,
  "question": "Which agents improved the most?",
  "logic": "Latest Score - First Score.",
  "considerations": "Minimum 2 periods."
 },
 {
  "category": "Trend",
  "number": 6,
  "question": "Which agents declined the most?",
  "logic": "Latest Score - First Score (largest negative).",
  "considerations": "Minimum 2 periods."
 },
 {
  "category": "Consistency",
  "number": 7,
  "question": "Which agents are the most consistent?",
  "logic": "Lowest standard deviation of scores.",
  "considerations": "Recommend >=4 periods."
 },
 {
  "category": "Consistency",
  "number": 8,
  "question": "Which agents are the least consistent?",
  "logic": "Highest standard deviation of scores.",
  "considerations": "Recommend >=4 periods."
 },
 {
  "category": "Target Achievement",
  "number": 9,
  "question": "Which agents are closest to target?",
  "logic": "ABS(Current Score - Target).",
  "considerations": "Use latest score or selected-period average consistently."
 },
 {
  "category": "Target Achievement",
  "number": 10,
  "question": "Which agents are furthest below target?",
  "logic": "Target - Current Score for below-target agents.",
  "considerations": "Exclude agents meeting target."
 },
 {
  "category": "Recovery",
  "number": 11,
  "question": "Which agents have recovered the most?",
  "logic": "Latest Score - Lowest Historical Score after moving above target.",
  "considerations": "Agent must have been below target earlier."
 },
 {
  "category": "Risk",
  "number": 12,
  "question": "Which agents are early warning risks?",
  "logic": "Current >= Target but last 3 periods declining.",
  "considerations": "Recommend >=4 periods."
 },
 {
  "category": "Recognition",
  "number": 13,
  "question": "Which agents are silent performers?",
  "logic": "Avg>=Target + low SD + high hit rate + not Top10% score.",
  "considerations": "Recommend >=6 periods."
 },
 {
  "category": "Consistency",
  "number": 14,
  "question": "Which agents are roller coaster performers?",
  "logic": "High SD + alternating met/missed target.",
  "considerations": "Define SD threshold."
 },
 {
  "category": "Recognition",
  "number": 15,
  "question": "Who are the most reliable agents?",
  "logic": "Composite: Avg Score + Target Hit % + Consistency.",
  "considerations": "Suggested weights 50/30/20."
 },
 {
  "category": "Recognition",
  "number": 16,
  "question": "Which agents are one good week away from consistently meeting target?",
  "logic": "Average within configurable threshold (e.g. 2 pts) below target.",
  "considerations": "Threshold configurable."
 },
 {
  "category": "Risk",
  "number": 17,
  "question": "Which agents are one bad week away from missing target?",
  "logic": "Current average barely above target.",
  "considerations": "Threshold configurable."
 },
 {
  "category": "Coaching",
  "number": 18,
  "question": "Which agents improved after coaching?",
  "logic": "Compare average before coaching vs after coaching.",
  "considerations": "Requires coaching dates."
 },
 {
  "category": "Coaching",
  "number": 19,
  "question": "Which agents did not improve after coaching?",
  "logic": "No meaningful improvement after coaching.",
  "considerations": "Requires coaching dates."
 },
 {
  "category": "Trend",
  "number": 20,
  "question": "Which agents are improving faster than the team average?",
  "logic": "Weekly improvement slope > team slope.",
  "considerations": "Use linear trend or avg weekly delta."
 },
 {
  "category": "Trend",
  "number": 21,
  "question": "Which agents are declining faster than the team average?",
  "logic": "Weekly decline slope worse than team slope.",
  "considerations": "Use same calculation across agents."
 },
 {
  "category": "Business Impact",
  "number": 22,
  "question": "Which agents generate the most promoters?",
  "logic": "Count promoter surveys by agent.",
  "considerations": "NPS only. Apply minimum volume."
 },
 {
  "category": "Business Impact",
  "number": 23,
  "question": "Which agents generate the most detractors?",
  "logic": "Count detractor surveys by agent.",
  "considerations": "NPS only. Apply minimum volume."
 },
 {
  "category": "Volume",
  "number": 24,
  "question": "Which agents have the highest survey volume?",
  "logic": "Count surveys per agent.",
  "considerations": "Highlight top contributors."
 },
 {
  "category": "Volume",
  "number": 25,
  "question": "Which high-performing agents have very low survey volume?",
  "logic": "Above target score + low survey count.",
  "considerations": "Use minimum volume threshold."
 },
 {
  "category": "Business Impact",
  "number": 26,
  "question": "Which low-performing agents have very high survey volume?",
  "logic": "Below target score + high survey count.",
  "considerations": "High business impact."
 },
 {
  "category": "Business Impact",
  "number": 27,
  "question": "Which agents improved while handling more survey volume?",
  "logic": "Score increased and survey volume increased.",
  "considerations": "Compare first vs latest period."
 },
 {
  "category": "Business Impact",
  "number": 28,
  "question": "Which agents declined despite handling fewer surveys?",
  "logic": "Score declined while survey volume decreased.",
  "considerations": "Potential performance issue."
 },
 {
  "category": "Voice of Customer",
  "number": 29,
  "question": "Which agents consistently receive promoter comments?",
  "logic": "Highest count/rate of positive verbatims.",
  "considerations": "Requires text tagging."
 },
 {
  "category": "Voice of Customer",
  "number": 30,
  "question": "Which agents consistently receive negative comments?",
  "logic": "Highest count/rate of negative verbatims.",
  "considerations": "Requires text tagging."
 },
 {
  "category": "Voice of Customer",
  "number": 31,
  "question": "Which agents have the widest gap between score and sentiment?",
  "logic": "Compare sentiment score with NPS/CSAT.",
  "considerations": "Flag largest mismatch."
 },
 {
  "category": "Statistics",
  "number": 32,
  "question": "Which agents are statistically outperforming peers?",
  "logic": "Z-score significantly above team mean.",
  "considerations": "Recommend Z > +2."
 },
 {
  "category": "Statistics",
  "number": 33,
  "question": "Which agents are statistically underperforming peers?",
  "logic": "Z-score significantly below team mean.",
  "considerations": "Recommend Z < -2."
 },
 {
  "category": "Movement",
  "number": 34,
  "question": "Which agents changed performance category?",
  "logic": "Track movement between categories across periods.",
  "considerations": "Define categories (Champion, At Risk, etc.)."
 },
 {
  "category": "Movement",
  "number": 35,
  "question": "Which agents have plateaued?",
  "logic": "Little/no score change across selected periods.",
  "considerations": "Variance below small threshold."
 },
 {
  "category": "Trend",
  "number": 36,
  "question": "Which agents have the fastest improvement rate?",
  "logic": "Highest average weekly gain.",
  "considerations": "Requires >=3 periods."
 },
 {
  "category": "Trend",
  "number": 37,
  "question": "Which agents have the fastest decline rate?",
  "logic": "Highest average weekly loss.",
  "considerations": "Requires >=3 periods."
 },
 {
  "category": "Volume",
  "number": 38,
  "question": "Which agents perform best under high survey volume?",
  "logic": "Positive correlation between score and volume.",
  "considerations": "Recommend minimum observations."
 },
 {
  "category": "Trend",
  "number": 39,
  "question": "Which agents show seasonal behaviour?",
  "logic": "Compare performance by weekday/month/time.",
  "considerations": "Needs sufficient historical data."
 },
 {
  "category": "Business Impact",
  "number": 40,
  "question": "Which agents have the highest business impact?",
  "logic": "Normalized (Survey Volume x Gap to Target x Detractor Rate).",
  "considerations": "Normalize metrics and apply minimum volume."
 }
];
function qaAgentField(row,names){for(const name of names.filter(Boolean)){if(row&&row[name]!==undefined&&row[name]!==null&&row[name]!=='')return row[name]}return undefined}
function qaMappedNames(key, fallback=[]){const mapped=state.mapping?.[key];return mapped?[mapped,...fallback]:fallback}
function qaAgentName(row){return nameOf(row)||String(qaAgentField(row,qaMappedNames('agent',['Agent','Agent Name','agent','name','Name','Employee','Employee Name']))||'Unmapped agent')}
function qaAgentScore(row){return num(qaAgentField(row,qaMappedNames('score',['Agent NPS','NPS','nps','NPS Score','Score','score','CSAT','Agent CSAT'])))}
function qaAgentPeriod(row){return qaAgentField(row,qaMappedNames('date',qaMappedNames('wave',['Week','Period','Date','Month','period','week','date','Conversation Date','Survey Date'])))}
function qaAgentResponses(row){return num(qaAgentField(row,['Responses','responses','Count','count','Volume','Surveys','surveys']))}
function qaAgentMovement(row){return num(qaAgentField(row,['Movement','movement','Change','change','NPS Change','Trend','trend','Delta','delta']))}
function qaAgentPromoters(row){return num(qaAgentField(row,['Promoters','promoters','Promoter Count','Positive','Positive Count']))}
function qaAgentDetractors(row){return num(qaAgentField(row,['Detractors','detractors','Detractor Count','Negative','Negative Count']))}
function qaNpsBand(row){
 const label=String(qaAgentField(row,qaMappedNames('satisfaction',['NPS Type','NPS Category','Category','Segment','segment']))||'').toLowerCase();
 const score=qaAgentScore(row),promoterMin=num(state.rules.satisfiedMin),passiveMin=num(state.rules.neutralMin);
 if(label.includes('promoter'))return 'Promoter';
 if(label.includes('detractor'))return 'Detractor';
 if(label.includes('passive'))return 'Passive';
 if(Number.isFinite(score)){if(score>=promoterMin)return 'Promoter';if(score>=passiveMin)return 'Passive';return 'Detractor'}
 return '';
}
function qaRawRows(){return [...(state.analysis?.feedbackRows||[]),...(state.analysis?.feedbackTableRows||[]),...(state.analysis?.preview||[])]}
function qaDerivedAgentsFromRows(){
 const groups={};
 qaRawRows().forEach(row=>{const name=qaAgentName(row);if(!name||name==='Unmapped agent')return;const bucket=(groups[name] ||= {raw:{},name,score:NaN,responses:0,movement:NaN,promoters:0,detractors:0,passives:0,values:[]});const score=qaAgentScore(row),band=qaNpsBand(row);bucket.responses+=1;if(Number.isFinite(score))bucket.values.push(score);if(band==='Promoter')bucket.promoters+=1;else if(band==='Detractor')bucket.detractors+=1;else if(band==='Passive')bucket.passives+=1});
 return Object.values(groups).map(row=>{const total=row.promoters+row.passives+row.detractors;row.score=total?(row.promoters/total*100-row.detractors/total*100):(row.values.length?avg(row.values):NaN);return row});
}
function qaAgents(){const summary=(state.analysis?.agents||[]).map(row=>({raw:row,name:qaAgentName(row),score:qaAgentScore(row),responses:qaAgentResponses(row),movement:qaAgentMovement(row),promoters:qaAgentPromoters(row),detractors:qaAgentDetractors(row)})).filter(row=>row.name&&row.name!=='Unmapped agent');const derived=qaDerivedAgentsFromRows();const byName={};derived.forEach(row=>byName[row.name]=row);summary.forEach(row=>{byName[row.name]={...(byName[row.name]||{}),...row,responses:Number.isFinite(row.responses)?row.responses:byName[row.name]?.responses,promoters:Number.isFinite(row.promoters)?row.promoters:byName[row.name]?.promoters,detractors:Number.isFinite(row.detractors)?row.detractors:byName[row.name]?.detractors,score:Number.isFinite(row.score)?row.score:byName[row.name]?.score}});return Object.values(byName).filter(row=>row.name)}
function qaTopText(rows,metric='Metric',formatter=value=>Number.isFinite(value)?fmt(value):'n/a'){
 const valid=rows.filter(row=>Number.isFinite(row.value));
 if(!valid.length)return 'Not enough mapped agent evidence is available for this calculation.';
 return valid.slice(0,5).map((row,index)=>`${index+1}. ${row.name} (${formatter(row.value)}${Number.isFinite(row.responses)?`, n=${Math.round(row.responses).toLocaleString()}`:''})`).join(' | ');
}
function qaEvidence(rows,metric='Metric',formatter=value=>Number.isFinite(value)?fmt(value):'n/a'){
 return rows.filter(row=>Number.isFinite(row.value)).slice(0,10).map((row,index)=>({Rank:index+1,Agent:row.name,[metric]:formatter(row.value),First:Number.isFinite(row.first)?fmt(row.first):'',Latest:Number.isFinite(row.latest)?fmt(row.latest):'',NPS:Number.isFinite(row.score)?fmt(row.score):'',Responses:Number.isFinite(row.responses)?Math.round(row.responses):''}));
}
function qaPeriodSortValue(period){const time=new Date(period).getTime();return Number.isNaN(time)?String(period):time}
function qaAgentPeriodGroups(){
 const a=state.analysis||{},arrays=Object.values(a).filter(Array.isArray),rows=[];
 arrays.forEach(arr=>arr.forEach(row=>{if(!row||typeof row!=='object')return;const agent=qaAgentName(row),period=qaAgentPeriod(row),score=qaAgentScore(row);if(agent&&agent!=='Unmapped agent'&&period&&Number.isFinite(score))rows.push({agent,period:String(period),score,responses:qaAgentResponses(row)})}));
 const groups={};rows.forEach(row=>{(groups[row.agent] ||= []).push(row)});
 return Object.entries(groups).map(([agent,periods])=>({agent,periods:periods.sort((x,y)=>qaPeriodSortValue(x.period)>qaPeriodSortValue(y.period)?1:-1)})).filter(group=>group.periods.length>=2);
}
function qaStreak(periods,target,met=true){let best=0,current=0;periods.forEach(row=>{const ok=met?row.score>=target:row.score<target;current=ok?current+1:0;best=Math.max(best,current)});return best}
function qaGroupMovementRows(groups, positive=true){
 return groups.map(group=>{const first=group.periods[0],latest=group.periods.at(-1),movement=latest.score-first.score;return {name:group.agent,value:movement,responses:group.periods.length,score:latest.score,first:first.score,latest:latest.score,firstPeriod:first.period,latestPeriod:latest.period}}).filter(row=>Number.isFinite(row.value)&&(positive?row.value>0:row.value<0)).sort((a,b)=>positive?b.value-a.value:a.value-b.value);
}
function qaConsistentRows(groups, improving=true){
 return groups.filter(group=>group.periods.every((row,index)=>!index||(improving?row.score>=group.periods[index-1].score:row.score<=group.periods[index-1].score))).map(group=>({name:group.agent,value:group.periods.at(-1).score-group.periods[0].score,responses:group.periods.length,score:group.periods.at(-1).score,first:group.periods[0].score,latest:group.periods.at(-1).score})).sort((a,b)=>improving?b.value-a.value:a.value-b.value);
}
function qaVolatilityRows(groups, high=true){
 const rows=groups.map(group=>{const values=group.periods.map(row=>row.score).filter(Number.isFinite);return {name:group.agent,value:std(values),responses:group.periods.length,score:group.periods.at(-1)?.score,first:Math.min(...values),latest:Math.max(...values)}}).filter(row=>Number.isFinite(row.value));
 return rows.sort((a,b)=>high?b.value-a.value:a.value-b.value);
}
function qaBusinessImpactRows(agents,target){
 return agents.map(row=>{const gap=Number.isFinite(target)&&Number.isFinite(row.score)?Math.max(0,target-row.score):0,detRate=Number.isFinite(row.detractors)&&Number.isFinite(row.responses)&&row.responses?row.detractors/row.responses:0,value=(row.responses||0)*gap*(detRate||0);return {...row,value}}).filter(row=>Number.isFinite(row.value)&&row.value>0).sort((a,b)=>b.value-a.value);
}
function qaRecoveryRows(groups,target){
 return groups.map(group=>{const values=group.periods.map(row=>row.score).filter(Number.isFinite),lowest=Math.min(...values),latest=group.periods.at(-1)?.score,hadBelow=Number.isFinite(target)&&values.some(value=>value<target),value=Number.isFinite(latest)&&Number.isFinite(lowest)?latest-lowest:NaN;return {name:group.agent,value,responses:group.periods.length,score:latest,first:lowest,latest}}).filter(row=>Number.isFinite(row.value)&&row.value>0).sort((a,b)=>b.value-a.value);
}
function qaEarlyWarningRows(groups,target){
 return groups.map(group=>{const last=group.periods.slice(-3),latest=group.periods.at(-1)?.score,declining=last.length>=3&&last.every((row,index)=>!index||row.score<last[index-1].score);return {name:group.agent,value:declining&&Number.isFinite(target)&&latest>=target?target-latest:NaN,responses:group.periods.length,score:latest,first:last[0]?.score,latest}}).filter(row=>Number.isFinite(row.value)).sort((a,b)=>b.score-a.score);
}
function qaCoachingRows(groups,item){
 const coachingDate=state.qaCoachingDate?new Date(state.qaCoachingDate).getTime():NaN,threshold=Number.isFinite(num(state.qaCoachingThreshold))?num(state.qaCoachingThreshold):0;
 if(!Number.isFinite(coachingDate))return {rows:[],answer:'Enter the coaching intervention date below, then click Recalculate.',status:'Needs coaching date'};
 const rows=groups.map(group=>{const before=group.periods.filter(row=>new Date(row.period).getTime()<coachingDate).map(row=>row.score).filter(Number.isFinite),after=group.periods.filter(row=>new Date(row.period).getTime()>=coachingDate).map(row=>row.score).filter(Number.isFinite);const beforeAvg=before.length?avg(before):NaN,afterAvg=after.length?avg(after):NaN,movement=Number.isFinite(beforeAvg)&&Number.isFinite(afterAvg)?afterAvg-beforeAvg:NaN;return {name:group.agent,value:movement,responses:before.length+after.length,score:afterAvg,first:beforeAvg,latest:afterAvg,beforeCount:before.length,afterCount:after.length}}).filter(row=>Number.isFinite(row.value)&&row.responses>=2);
 const filtered=item.number===18?rows.filter(row=>row.value>threshold).sort((a,b)=>b.value-a.value):rows.filter(row=>row.value<=threshold).sort((a,b)=>a.value-b.value);
 const label=item.number===18?'improved after coaching':'did not improve after coaching';
 return {rows:filtered,answer:filtered.length?qaTopText(filtered,'Coaching Movement',value=>`${signed(value)} pts`):`No agents ${label} using coaching date ${state.qaCoachingDate} and threshold ${fmt(threshold)} pts.`,status:'Recalculated'};
}
function qaCoachingControls(index,item){
 if(!(item?.number===18||item?.number===19))return '';
 return `<section class="qa-coaching-recalc"><div><strong>Enter coaching details</strong><p>Use a common intervention date for this run. I will compare each agent's average score before the date vs after the date.</p></div><label>Coaching date<input id="qaCoachingDate" type="date" value="${escapeHtml(state.qaCoachingDate||'')}"></label><label>Improvement threshold<input id="qaCoachingThreshold" type="number" step="0.01" value="${escapeHtml(String(state.qaCoachingThreshold??0))}"></label><button id="qaCoachingRecalculate" type="button">Recalculate</button></section>`;
}
function bindQaCoachingControls(index){
 const button=$('qaCoachingRecalculate');if(!button)return;
 button.onclick=()=>{state.qaCoachingDate=$('qaCoachingDate')?.value||'';state.qaCoachingThreshold=num($('qaCoachingThreshold')?.value);if(state.activeLens==='qa'&&$('lensContent')){$('lensContent').innerHTML=renderLensContent('qa');bindQaLensCards()}showQaLensDetail(index)};
}
function qaAnswerForQuestion(item){
 const agents=qaAgents(),target=num(state.rules.target),groups=qaAgentPeriodGroups(),minSample=Number(state.rules.minimumSample||10);
 const scoreRows=agents.filter(row=>Number.isFinite(row.score)).map(row=>({...row,value:row.score}));
 const responseRows=agents.filter(row=>Number.isFinite(row.responses)).map(row=>({...row,value:row.responses})).sort((a,b)=>b.value-a.value);
 const movementRows=agents.filter(row=>Number.isFinite(row.movement)).map(row=>({...row,value:row.movement}));
 const below=scoreRows.filter(row=>Number.isFinite(target)&&row.score<target);
 const above=scoreRows.filter(row=>Number.isFinite(target)&&row.score>=target);
 let rows=[],answer='Not enough mapped agent evidence is available for this calculation.',metric='Metric',formatter=value=>Number.isFinite(value)?fmt(value):'n/a',status='Directional';
 if(item.number===1||item.number===2){
  if(groups.length&&Number.isFinite(target)){rows=groups.map(group=>({name:group.agent,value:qaStreak(group.periods,target,item.number===1),responses:group.periods.length,score:group.periods.at(-1)?.score})).sort((a,b)=>b.value-a.value);metric=item.number===1?'Target Streak':'Missed Streak';formatter=value=>`${Math.round(value)} period(s)`;answer=qaTopText(rows,metric,formatter)}
  else{rows=(item.number===1?above:below).map(row=>({...row,value:Math.abs(row.score-target)})).sort((a,b)=>b.score-a.score);answer=(item.number===1?'Agent-by-period streak data is not available. Current agents meeting target: ':'Agent-by-period streak data is not available. Current agents below target: ')+qaTopText(rows,'Current Gap',value=>`${fmt(value)} pts`);metric='Current Gap';formatter=value=>`${fmt(value)} pts`;status='Needs period history'}
 }else if(item.number===3){
  rows=qaConsistentRows(groups,true);metric='Improvement';formatter=value=>`${signed(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):(groups.length?'No agents consistently improved across every available period.':'This needs at least two mapped periods per agent.');
 }else if(item.number===5||item.number===20||item.number===27||item.number===36){
  rows=movementRows.filter(row=>row.value>0).sort((a,b)=>b.value-a.value);if(!rows.length)rows=qaGroupMovementRows(groups,true);metric='Improvement';formatter=value=>`${signed(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):(groups.length?'No agents improved between first and latest available period.':'This needs at least two mapped periods per agent.');
 }else if(item.number===4){
  rows=qaConsistentRows(groups,false).map(row=>({...row,value:Math.abs(row.value)}));metric='Decline';formatter=value=>`-${fmt(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):(groups.length?'No agents consistently declined across every available period.':'This needs at least two mapped periods per agent.');
 }else if(item.number===6||item.number===21||item.number===28||item.number===37){
  rows=movementRows.filter(row=>row.value<0).sort((a,b)=>a.value-b.value).map(row=>({...row,value:Math.abs(row.value)}));if(!rows.length)rows=qaGroupMovementRows(groups,false).map(row=>({...row,value:Math.abs(row.value)}));metric='Decline';formatter=value=>`-${fmt(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):(groups.length?'No agents declined between first and latest available period.':'This needs at least two mapped periods per agent.');
 }else if(item.number===38){
  const volumes=responseRows.map(row=>row.responses).filter(Number.isFinite).sort((a,b)=>a-b),medianVolume=volumes.length?volumes[Math.floor(volumes.length/2)]:NaN;rows=scoreRows.filter(row=>!Number.isFinite(medianVolume)||row.responses>=medianVolume).sort((a,b)=>b.score-a.score).map(row=>({...row,value:row.score}));metric='NPS Under High Volume';answer=qaTopText(rows,metric,formatter);
 }else if(item.number===7||item.number===13||item.number===15){
  rows=scoreRows.filter(row=>!Number.isFinite(row.responses)||row.responses>=minSample).sort((a,b)=>b.score-a.score).map(row=>({...row,value:row.score}));metric='NPS';answer=qaTopText(rows,metric,formatter);
 }else if(item.number===8||item.number===14){
  rows=qaVolatilityRows(groups,true);metric='Period SD';formatter=value=>`${fmt(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):'This needs at least two mapped periods per agent to rank volatility.';status=rows.length?'Directional':'Needs period history';
 }else if(item.number===35){
  rows=qaVolatilityRows(groups,false);metric='Period SD';formatter=value=>`${fmt(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):'This needs at least two mapped periods per agent to identify plateaued agents.';status=rows.length?'Directional':'Needs period history';
 }else if(item.number===9){
  rows=scoreRows.map(row=>({...row,value:Math.abs(row.score-target)})).sort((a,b)=>a.value-b.value);metric='Distance to Target';formatter=value=>`${fmt(value)} pts`;answer=qaTopText(rows,metric,formatter);
 }else if(item.number===40){
  rows=qaBusinessImpactRows(agents,target);metric='Impact Score';formatter=value=>fmt(value);answer=rows.length?qaTopText(rows,metric,formatter):'No below-target high-volume detractor concentration is available from mapped agent evidence.';
 }else if(item.number===17){
  rows=above.map(row=>({...row,value:row.score-target})).filter(row=>row.value<=2).sort((a,b)=>a.value-b.value);metric='Points Above Target';formatter=value=>`${fmt(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):'No above-target agents are within 2 points of missing target from mapped agent evidence.';
 }else if(item.number===26){
  rows=below.filter(row=>Number.isFinite(row.responses)).map(row=>({...row,value:row.responses})).sort((a,b)=>b.value-a.value);metric='Below-Target Volume';formatter=value=>Math.round(value).toLocaleString();answer=rows.length?qaTopText(rows,metric,formatter):'No low-performing high-volume agents are available from mapped agent evidence.';
 }else if(item.number===10){
  rows=below.map(row=>({...row,value:target-row.score})).sort((a,b)=>b.value-a.value);metric='Gap Below Target';formatter=value=>`${fmt(value)} pts`;answer=qaTopText(rows,metric,formatter);
 }else if(item.number===11){
  rows=qaRecoveryRows(groups,target);metric='Recovery';formatter=value=>`${signed(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):'This needs at least two mapped periods per agent to calculate recovery from lowest historical score.';
 }else if(item.number===12){
  rows=qaEarlyWarningRows(groups,target);metric='Above Target Cushion';formatter=value=>`${fmt(Math.abs(value))} pts`;answer=rows.length?qaTopText(rows,metric,formatter):'No above-target agents with three-period decline were found, or period history is not available.';
 }else if(item.number===16){
  rows=below.map(row=>({...row,value:target-row.score})).filter(row=>row.value<=2).sort((a,b)=>a.value-b.value);metric='Points Below Target';formatter=value=>`${fmt(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):'No below-target agents are within 2 points of target from mapped agent evidence.';
 }else if(item.number===34||item.number===39){
  rows=movementRows.sort((a,b)=>Math.abs(b.value)-Math.abs(a.value)).slice(0,10);if(!rows.length)rows=qaGroupMovementRows(groups,true).concat(qaGroupMovementRows(groups,false)).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value)).slice(0,10);metric='Movement';formatter=value=>`${signed(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):'This calculation needs period or category history that is not available in the current completed payload.';
 }else if(item.number===18||item.number===19){
  const coaching=qaCoachingRows(groups,item);rows=coaching.rows;metric='Coaching Movement';formatter=value=>`${signed(value)} pts`;answer=coaching.answer;status=coaching.status;
 }else if(item.number===22){
  rows=agents.filter(row=>Number.isFinite(row.promoters)).map(row=>({...row,value:row.promoters})).sort((a,b)=>b.value-a.value);metric='Promoters';formatter=value=>Math.round(value).toLocaleString();answer=qaTopText(rows,metric,formatter);
 }else if(item.number===23){
  rows=agents.filter(row=>Number.isFinite(row.detractors)).map(row=>({...row,value:row.detractors})).sort((a,b)=>b.value-a.value);metric='Detractors';formatter=value=>Math.round(value).toLocaleString();answer=qaTopText(rows,metric,formatter);
 }else if(item.number===24){
  rows=responseRows;metric='Survey Volume';formatter=value=>Math.round(value).toLocaleString();answer=qaTopText(rows,metric,formatter);
 }else if(item.number===25){
  rows=agents.filter(row=>Number.isFinite(row.score)&&Number.isFinite(row.responses)&&Number.isFinite(target)&&row.score>=target).map(row=>({...row,value:row.responses})).sort((a,b)=>a.value-b.value);metric='Low Survey Volume';formatter=value=>Math.round(value).toLocaleString();answer=rows.length?qaTopText(rows,metric,formatter):'No above-target low-volume agents are available from mapped agent evidence.';
 }else if(item.number===29||item.number===30){
  const stats=typeof sentimentStats==='function'?sentimentStats():null,source=stats?.agents||[];
  rows=source.map(row=>({name:row.name,value:item.number===30?row.Negative||row.negative||row.total-row.Positive:row.Positive||row.positive||row.nss,responses:row.total,score:row.nss})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>b.value-a.value);metric=item.number===30?'Negative Comments':'Positive / Sentiment';formatter=value=>Number.isFinite(value)?fmt(value):'n/a';answer=rows.length?qaTopText(rows,metric,formatter):'Sparrow sentiment by agent is not available for this run.';
 }else if(item.number===31){
  const stats=typeof sentimentStats==='function'?sentimentStats():null,source=stats?.agents||[],scores={};scoreRows.forEach(row=>scores[row.name]=row.score);rows=source.map(row=>({name:row.name,value:Number.isFinite(scores[row.name])&&Number.isFinite(row.nss)?Math.abs(scores[row.name]-row.nss):NaN,responses:row.total,score:scores[row.name],latest:row.nss})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>b.value-a.value);metric='Score/Sentiment Gap';formatter=value=>`${fmt(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):'Matched agent score and Sparrow sentiment evidence is not available for this run.';
 }else if(item.number===32||item.number===33){
  const scores=scoreRows.map(row=>row.score),mean=avg(scores),deviation=std(scores);rows=scoreRows.map(row=>({...row,value:deviation?(row.score-mean)/deviation:NaN})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>item.number===32?b.value-a.value:a.value-b.value);metric='Z-score';formatter=value=>fmt(value);answer=qaTopText(rows,metric,formatter);
 }else{
  rows=scoreRows.sort((a,b)=>b.score-a.score);metric='NPS';answer=qaTopText(rows,metric,formatter);
 }
 const evidence=qaEvidence(rows,metric,formatter);
 return {answer,metric,status,evidence};
}
function qaLensInsightRows(){return qaLensQuestionBank.map(item=>{const result=qaAnswerForQuestion(item);return{title:`${item.number}. ${item.question}`,finding:result.answer,why:item.considerations,evidence:[`Category: ${item.category}`,`Answer: ${result.answer}`,`Calculation: ${item.logic}`]}})}
function showQaLensDetail(index){const item=qaLensQuestionBank[index],result=qaAnswerForQuestion(item);if(!item)return;$('evidenceStatus').textContent=`QA LENS ${item.number} - ${result.status||'SUPPORTING EVIDENCE'}`;$('evidenceTitle').textContent=item.question;$('evidenceAnswer').textContent=result.answer;$('evidenceMethod').textContent='Calculated from the completed NPS analysis payload and the QA Lens master workbook definition.';$('evidenceDerived').textContent=result.answer;$('evidenceLogic').textContent=item.logic;$('evidenceStatistics').textContent=result.metric||'Agent-level ranking';$('evidenceGuardrail').textContent=item.considerations||'Interpret the result with mapped fields, selected target, and minimum sample settings.';const rows=result.evidence||[],controls=qaCoachingControls(index,item);if(!rows.length){$('evidenceTable').innerHTML=controls+'<p class="table-hint">This question needs additional period, coaching, sentiment, or category history that is not available in the current completed payload.</p>'}else{const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))].slice(0,8);$('evidenceTable').innerHTML=controls+`<h3 class="evidence-data-title">Actual calculation rows</h3><div class="results-table-wrap"><table class="evidence-table"><thead><tr>${columns.map(column=>`<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(column=>`<td>${escapeHtml(row[column]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}bindQaCoachingControls(index);const dialog=$('evidenceDialog');if(!dialog.open)dialog.showModal()}
function bindQaLensCards(){document.querySelectorAll('[data-qa-info]').forEach(button=>button.onclick=event=>{event.preventDefault();event.stopPropagation();showQaLensDetail(Number(button.dataset.qaInfo))})}
function renderQaLensContent(){
 return `<section class="lens-readout qa-lens-readout"><div class="qa-lens-question-grid">${qaLensQuestionBank.map((item,index)=>{const result=qaAnswerForQuestion(item);return `<article class="qa-lens-question-card"><div class="qa-lens-card-head"><span>${item.number}</span><div><small>${escapeHtml(item.category)}</small><h3>${escapeHtml(item.question)}</h3></div><button class="qa-lens-info-button" type="button" data-qa-info="${index}" title="View logic and calculation" aria-label="View logic and calculation">i</button></div><div class="qa-lens-answer"><small>Answer</small><p>${escapeHtml(result.answer)}</p></div></article>`}).join('')}</div></section>`;
}
const tlLensQuestionBank=[
 {
  "category": "Recognition",
  "number": 1,
  "question": "Which agents achieved target this period?",
  "logic": "Agent Score >= Target",
  "considerations": "Based on selected reporting period. Use Agent NPS or Agent CSAT only, not QA score."
 },
 {
  "category": "Recognition",
  "number": 2,
  "question": "Which agents exceeded target by the highest margin?",
  "logic": "Current Score - Target",
  "considerations": "Rank descending. Use latest period or selected-period average consistently."
 },
 {
  "category": "Recognition",
  "number": 3,
  "question": "Which agents have the longest target achievement streak?",
  "logic": "Maximum consecutive periods where Agent Score >= Target",
  "considerations": "Use all selected periods. Streak breaks when score falls below target."
 },
 {
  "category": "Recognition",
  "number": 4,
  "question": "Which agents consistently exceed target?",
  "logic": "Average Score > Target AND Target Hit Rate >= 80%",
  "considerations": "Minimum 4 periods recommended. Threshold can be configured."
 },
 {
  "category": "Recognition",
  "number": 5,
  "question": "Which agents improved the most?",
  "logic": "Latest Score - First Available Score",
  "considerations": "Minimum 2 periods. Use all available periods in selected range."
 },
 {
  "category": "Coaching Focus",
  "number": 6,
  "question": "Which agents missed target this period?",
  "logic": "Current Score < Target",
  "considerations": "Current reporting period. Use CX target for NPS/CSAT."
 },
 {
  "category": "Coaching Focus",
  "number": 7,
  "question": "Which agents have the longest missed target streak?",
  "logic": "Maximum consecutive periods where Agent Score < Target",
  "considerations": "Use all selected periods. Rank by longest streak."
 },
 {
  "category": "Coaching Focus",
  "number": 8,
  "question": "Which agents are consistently declining?",
  "logic": "Every period score <= previous period score",
  "considerations": "Evaluate across the selected period. Equal values allowed."
 },
 {
  "category": "Coaching Focus",
  "number": 9,
  "question": "Which agents are closest to recovering?",
  "logic": "For below-target agents: Target - Current Score. Lowest gap is closest.",
  "considerations": "Useful for quick coaching wins. Exclude agents already meeting target."
 },
 {
  "category": "Coaching Focus",
  "number": 10,
  "question": "Which agents require immediate coaching?",
  "logic": "Composite: missed target streak + gap to target + declining trend + detractor rate",
  "considerations": "Weights can be configured. Recommended for TL daily priority queue."
 },
 {
  "category": "Consistency",
  "number": 11,
  "question": "Which agents are the most consistent?",
  "logic": "Lowest standard deviation of Agent NPS/CSAT across periods",
  "considerations": "Minimum 4 periods recommended."
 },
 {
  "category": "Consistency",
  "number": 12,
  "question": "Which agents are the least consistent?",
  "logic": "Highest standard deviation of Agent NPS/CSAT across periods",
  "considerations": "Minimum 4 periods recommended. Indicates unpredictable CX performance."
 },
 {
  "category": "Consistency",
  "number": 13,
  "question": "Which agents fluctuate the most?",
  "logic": "Max Score - Min Score across selected periods",
  "considerations": "Use selected period. High range = high fluctuation."
 },
 {
  "category": "Consistency",
  "number": 14,
  "question": "Which agents have plateaued?",
  "logic": "Low variance and low slope across selected periods",
  "considerations": "Define threshold, e.g., score change within +/-1 or +/-2 points."
 },
 {
  "category": "Trend & Momentum",
  "number": 15,
  "question": "Which agents are improving every week?",
  "logic": "Each period score >= previous period score",
  "considerations": "Use all available periods. Equal values allowed."
 },
 {
  "category": "Trend & Momentum",
  "number": 16,
  "question": "Which agents recovered after poor performance?",
  "logic": "Agent was below target earlier and is now at/above target for latest period",
  "considerations": "Can require 2 consecutive met periods to confirm recovery."
 },
 {
  "category": "Trend & Momentum",
  "number": 17,
  "question": "Which agents have the fastest improvement rate?",
  "logic": "Average weekly gain or regression slope of score over time",
  "considerations": "Minimum 3 periods recommended."
 },
 {
  "category": "Customer Impact",
  "number": 18,
  "question": "Which agents generate the most promoters?",
  "logic": "Count promoter responses by agent or promoter rate",
  "considerations": "NPS only. Apply minimum survey volume threshold."
 },
 {
  "category": "Customer Impact",
  "number": 19,
  "question": "Which agents generate the most detractors?",
  "logic": "Count detractor responses by agent or detractor rate",
  "considerations": "NPS only. Apply minimum survey volume threshold."
 },
 {
  "category": "Customer Impact",
  "number": 20,
  "question": "Which agents have the highest business impact?",
  "logic": "Normalized Survey Volume x Gap to Target x Detractor Rate",
  "considerations": "Prioritizes agents affecting the largest number of customers."
 }
];
const opsLensQuestionBank=[
 {
  "category": "Team Health",
  "number": 1,
  "question": "Which teams consistently meet target?",
  "logic": "Team Target Achievement Rate = periods meeting target / total periods",
  "considerations": "Use selected reporting period. Team score should be team-level NPS/CSAT."
 },
 {
  "category": "Team Health",
  "number": 2,
  "question": "Which teams consistently miss target?",
  "logic": "Lowest Team Target Achievement Rate",
  "considerations": "Use all selected periods. Useful for identifying chronic underperformance."
 },
 {
  "category": "Team Health",
  "number": 3,
  "question": "Which teams improved the most?",
  "logic": "Latest Team Score - First Team Score",
  "considerations": "Minimum 2 periods. Rank descending."
 },
 {
  "category": "Team Health",
  "number": 4,
  "question": "Which teams declined the most?",
  "logic": "Latest Team Score - First Team Score; rank most negative",
  "considerations": "Minimum 2 periods. Rank ascending."
 },
 {
  "category": "TL Performance",
  "number": 5,
  "question": "Which TLs have the highest-performing teams?",
  "logic": "Average team NPS/CSAT by TL",
  "considerations": "Rank TLs. Use selected-period average."
 },
 {
  "category": "TL Performance",
  "number": 6,
  "question": "Which TLs have the most consistent teams?",
  "logic": "Lowest standard deviation of team score over time",
  "considerations": "Minimum 4 periods recommended."
 },
 {
  "category": "TL Performance",
  "number": 7,
  "question": "Which TLs improved team performance the most?",
  "logic": "Latest Team Score - First Team Score by TL",
  "considerations": "Use same selected period across all TLs."
 },
 {
  "category": "TL Performance",
  "number": 8,
  "question": "Which TLs need intervention?",
  "logic": "Composite: low team score + missed targets + declining trend + high detractor rate",
  "considerations": "Weights configurable. Best used as Operations Manager priority queue."
 },
 {
  "category": "Performance Distribution",
  "number": 9,
  "question": "Which teams have the highest percentage of agents meeting target?",
  "logic": "Agents meeting target / total agents in team",
  "considerations": "Selected period or selected-period average."
 },
 {
  "category": "Performance Distribution",
  "number": 10,
  "question": "Which teams have the lowest percentage of agents meeting target?",
  "logic": "Same as above, ranked ascending",
  "considerations": "Highlights teams with broad performance issues."
 },
 {
  "category": "Performance Distribution",
  "number": 11,
  "question": "Which teams have the greatest agent performance variation?",
  "logic": "Standard deviation of agent scores within each team",
  "considerations": "Current period or selected-period average."
 },
 {
  "category": "Survey Volume",
  "number": 12,
  "question": "Which teams handled the highest survey volume?",
  "logic": "Total survey responses by team",
  "considerations": "Use selected reporting period."
 },
 {
  "category": "Survey Volume",
  "number": 13,
  "question": "Which teams improved despite higher workload?",
  "logic": "Team Score increased AND Survey Volume increased",
  "considerations": "Compare first vs latest period or previous vs current period."
 },
 {
  "category": "Survey Volume",
  "number": 14,
  "question": "Which teams declined despite lower workload?",
  "logic": "Team Score declined AND Survey Volume decreased",
  "considerations": "Useful as an operational concern indicator."
 },
 {
  "category": "Coaching Effectiveness",
  "number": 15,
  "question": "Which TLs have the most effective coaching outcomes?",
  "logic": "Team score improvement after coaching period or after intervention date",
  "considerations": "Requires coaching/intervention dates. If unavailable, use improvement trend as proxy."
 },
 {
  "category": "Coaching Effectiveness",
  "number": 16,
  "question": "Which teams recover fastest after missing target?",
  "logic": "Average number of periods required to return to target after a miss",
  "considerations": "Use all miss-and-recovery events in selected period."
 },
 {
  "category": "Business Impact",
  "number": 17,
  "question": "Which teams generate the most promoters?",
  "logic": "Promoter count/rate by team",
  "considerations": "NPS only. Apply minimum survey volume."
 },
 {
  "category": "Business Impact",
  "number": 18,
  "question": "Which teams generate the most detractors?",
  "logic": "Detractor count/rate by team",
  "considerations": "NPS only. Apply minimum survey volume."
 },
 {
  "category": "Operational Risk",
  "number": 19,
  "question": "Which teams are emerging risks?",
  "logic": "Declining trend + rising detractor rate + missed target streak",
  "considerations": "Composite indicator. Can flag amber/red risk."
 },
 {
  "category": "Operational Risk",
  "number": 20,
  "question": "Which teams have the highest business impact?",
  "logic": "Normalized Survey Volume x Gap to Target x Detractor Rate",
  "considerations": "Shows which team impacts overall business score the most."
 }
];

const clientLensQuestionBank=[
 {"category":"Executive Health","number":1,"question":"Are we meeting the agreed NPS/CSAT target?","logic":"Compare current score against contractual target.","considerations":"Use selected reporting period."},
 {"category":"Executive Health","number":2,"question":"How many reporting periods met target?","logic":"Count periods where Score >= Target.","considerations":"Use all periods in selected range."},
 {"category":"Executive Health","number":3,"question":"Is customer experience improving?","logic":"Compare latest score with first selected period.","considerations":"Minimum 2 periods."},
 {"category":"Executive Health","number":4,"question":"Is performance becoming more consistent?","logic":"Calculate score standard deviation over time.","considerations":"Recommend >=4 periods."},
 {"category":"Executive Health","number":5,"question":"What is the average variance to target?","logic":"Average(Score - Target).","considerations":"Selected reporting period."},
 {"category":"Customer Experience","number":6,"question":"Which customer segments improved the most?","logic":"Latest - First score by segment.","considerations":"Minimum 2 periods."},
 {"category":"Customer Experience","number":7,"question":"Which customer segments declined the most?","logic":"Largest negative change by segment.","considerations":"Minimum 2 periods."},
 {"category":"Customer Experience","number":8,"question":"Which channels have the highest NPS/CSAT?","logic":"Rank channels by average score.","considerations":"Minimum survey threshold."},
 {"category":"Customer Experience","number":9,"question":"Which regions have the highest NPS/CSAT?","logic":"Rank regions by average score.","considerations":"Minimum survey threshold."},
 {"category":"Customer Experience","number":10,"question":"Which products perform best?","logic":"Average score by product.","considerations":"Minimum survey threshold."},
 {"category":"Voice of Customer","number":11,"question":"What are the top positive themes?","logic":"Rank positive themes by frequency.","considerations":"Use sentiment/topic analysis."},
 {"category":"Voice of Customer","number":12,"question":"What are the top negative themes?","logic":"Rank negative themes by frequency.","considerations":"Use sentiment/topic analysis."},
 {"category":"Voice of Customer","number":13,"question":"Which themes are emerging?","logic":"Largest increase in mention frequency.","considerations":"Compare current vs previous period."},
 {"category":"Voice of Customer","number":14,"question":"Which complaint categories are increasing?","logic":"Trend complaint counts over time.","considerations":"Minimum 2 periods."},
 {"category":"Business Impact","number":15,"question":"Which issues contribute most to detractors?","logic":"Rank complaint themes among detractors.","considerations":"NPS only."},
 {"category":"Business Impact","number":16,"question":"Which improvements delivered the biggest gain?","logic":"Compare before/after implemented change.","considerations":"Requires intervention dates."},
 {"category":"Business Impact","number":17,"question":"Which customer segments have highest business impact?","logic":"Survey Volume Ã— Gap to Target.","considerations":"Normalize if comparing."},
 {"category":"Business Impact","number":18,"question":"Which operational KPI correlates most with NPS?","logic":"Highest Pearson correlation coefficient.","considerations":"Need operational metrics."},
 {"category":"Volume","number":19,"question":"Is survey participation increasing?","logic":"Trend survey counts.","considerations":"Selected period."},
 {"category":"Volume","number":20,"question":"Is response rate improving?","logic":"Trend response rate.","considerations":"Selected period."},
 {"category":"Volume","number":21,"question":"Is sample size statistically sufficient?","logic":"Compare responses against minimum threshold.","considerations":"Display confidence level."},
 {"category":"Volume","number":22,"question":"Does survey volume influence NPS?","logic":"Correlation between volume and score.","considerations":"Minimum observations."},
 {"category":"Segmentation","number":23,"question":"Which region contributes the most promoters?","logic":"Count promoters by region.","considerations":"NPS only."},
 {"category":"Segmentation","number":24,"question":"Which region contributes the most detractors?","logic":"Count detractors by region.","considerations":"NPS only."},
 {"category":"Segmentation","number":25,"question":"Which customer type has the lowest satisfaction?","logic":"Lowest average score.","considerations":"Minimum volume."},
 {"category":"Segmentation","number":26,"question":"Which product has the largest decline?","logic":"Latest - First score by product.","considerations":"Minimum 2 periods."}
];

function managerNameFromRow(row){return String(qaAgentField(row,qaMappedNames('manager',['Manager','Manager/TL','Manager Name','Team','Team Name','TL','Supervisor','manager','team']))||'Unmapped team')}
function managerScoreFromRow(row){return num(qaAgentField(row,['Manager NPS','Team NPS','NPS','nps','Score','score','CSAT','Manager CSAT']))}
function managerRowsSummary(){const derived={};qaRawRows().forEach(row=>{const name=managerNameFromRow(row);if(!name||name==='Unmapped team')return;const bucket=(derived[name] ||= {name,score:NaN,responses:0,promoters:0,detractors:0,passives:0,values:[]}),score=qaAgentScore(row),band=qaNpsBand(row);bucket.responses+=1;if(Number.isFinite(score))bucket.values.push(score);if(band==='Promoter')bucket.promoters+=1;else if(band==='Detractor')bucket.detractors+=1;else if(band==='Passive')bucket.passives+=1});const raw=Object.values(derived).map(row=>{const total=row.promoters+row.passives+row.detractors;row.score=total?(row.promoters/total*100-row.detractors/total*100):(row.values.length?avg(row.values):NaN);return row});const summary=(state.analysis?.managers||[]).map(row=>{return {name:managerNameFromRow(row),score:managerScoreFromRow(row),responses:qaAgentResponses(row),promoters:qaAgentPromoters(row),detractors:qaAgentDetractors(row)}}).filter(row=>row.name&&row.name!=='Unmapped team');const byName={};raw.forEach(row=>byName[row.name]=row);summary.forEach(row=>byName[row.name]={...(byName[row.name]||{}),...row,responses:Number.isFinite(row.responses)?row.responses:byName[row.name]?.responses,promoters:Number.isFinite(row.promoters)?row.promoters:byName[row.name]?.promoters,detractors:Number.isFinite(row.detractors)?row.detractors:byName[row.name]?.detractors,score:Number.isFinite(row.score)?row.score:byName[row.name]?.score});return Object.values(byName).filter(row=>row.name)}
function managerPeriodGroups(){const rows=[];Object.values(state.analysis||{}).filter(Array.isArray).forEach(arr=>arr.forEach(row=>{if(!row||typeof row!=='object')return;const team=managerNameFromRow(row),period=qaAgentPeriod(row),score=managerScoreFromRow(row)||qaAgentScore(row);if(team&&team!=='Unmapped team'&&period&&Number.isFinite(score))rows.push({agent:team,period:String(period),score,responses:qaAgentResponses(row)})}));const groups={};rows.forEach(row=>(groups[row.agent] ||= []).push(row));return Object.entries(groups).map(([agent,periods])=>({agent,periods:periods.sort((x,y)=>qaPeriodSortValue(x.period)>qaPeriodSortValue(y.period)?1:-1)})).filter(group=>group.periods.length>=2)}
function managerAgentDistribution(){const teams={};qaAgents().forEach(agent=>{const raw=agent.raw||{},team=managerNameFromRow(raw);if(!team||team==='Unmapped team')return;(teams[team] ||= []).push(agent)});return Object.entries(teams).map(([name,agents])=>{const target=num(state.rules.target),met=agents.filter(row=>Number.isFinite(row.score)&&row.score>=target).length,values=agents.map(row=>row.score).filter(Number.isFinite);return {name,value:agents.length?met/agents.length*100:NaN,responses:agents.length,score:values.length?avg(values):NaN,first:values.length?Math.min(...values):NaN,latest:values.length?Math.max(...values):NaN}})}
function lensEvidenceRows(rows,metric,formatter){return rows.filter(row=>Number.isFinite(row.value)).slice(0,10).map((row,index)=>({Rank:index+1,Name:row.name,[metric]:formatter(row.value),Score:Number.isFinite(row.score)?fmt(row.score):'',Responses:Number.isFinite(row.responses)?Math.round(row.responses):''}))}
function answerTlLens(item){const target=num(state.rules.target),agents=qaAgents(),groups=qaAgentPeriodGroups(),scoreRows=agents.filter(row=>Number.isFinite(row.score)).map(row=>({...row,value:row.score})),above=scoreRows.filter(row=>row.score>=target),below=scoreRows.filter(row=>row.score<target);let rows=[],metric='NPS',formatter=value=>Number.isFinite(value)?fmt(value):'n/a',answer='Not enough mapped agent evidence is available for this calculation.',status='Directional';if(item.number===1)rows=above.sort((a,b)=>b.score-a.score);else if(item.number===2){rows=above.map(row=>({...row,value:row.score-target})).sort((a,b)=>b.value-a.value);metric='Margin Above Target';formatter=value=>`${fmt(value)} pts`}else if(item.number===3){rows=groups.map(group=>({name:group.agent,value:qaStreak(group.periods,target,true),responses:group.periods.length,score:group.periods.at(-1)?.score})).sort((a,b)=>b.value-a.value);metric='Target Streak';formatter=value=>`${Math.round(value)} period(s)`}else if(item.number===4){rows=groups.map(group=>{const met=group.periods.filter(row=>row.score>=target).length,rate=group.periods.length?met/group.periods.length*100:NaN,avgScore=avg(group.periods.map(row=>row.score));return {name:group.agent,value:rate,responses:group.periods.length,score:avgScore}}).filter(row=>row.score>target&&row.value>=80).sort((a,b)=>b.value-a.value);metric='Target Hit Rate';formatter=value=>`${fmt(value)}%`}else if([5,15,17].includes(item.number)){rows=qaGroupMovementRows(groups,true);metric='Improvement';formatter=value=>`${signed(value)} pts`}else if(item.number===6)rows=below.sort((a,b)=>a.score-b.score);else if(item.number===7){rows=groups.map(group=>({name:group.agent,value:qaStreak(group.periods,target,false),responses:group.periods.length,score:group.periods.at(-1)?.score})).sort((a,b)=>b.value-a.value);metric='Missed Streak';formatter=value=>`${Math.round(value)} period(s)`}else if(item.number===8){rows=qaConsistentRows(groups,false).map(row=>({...row,value:Math.abs(row.value)}));metric='Decline';formatter=value=>`-${fmt(value)} pts`}else if(item.number===9){rows=below.map(row=>({...row,value:target-row.score})).sort((a,b)=>a.value-b.value);metric='Gap to Target';formatter=value=>`${fmt(value)} pts`}else if(item.number===10||item.number===20){rows=qaBusinessImpactRows(agents,target);metric='Impact Score'}else if(item.number===11||item.number===14){rows=qaVolatilityRows(groups,false);metric='Period SD';formatter=value=>`${fmt(value)} pts`}else if(item.number===12||item.number===13){rows=qaVolatilityRows(groups,true);metric=item.number===13?'Range / SD':'Period SD';formatter=value=>`${fmt(value)} pts`}else if(item.number===16){rows=qaRecoveryRows(groups,target);metric='Recovery';formatter=value=>`${signed(value)} pts`}else if(item.number===18){rows=agents.filter(row=>Number.isFinite(row.promoters)).map(row=>({...row,value:row.promoters})).sort((a,b)=>b.value-a.value);metric='Promoters';formatter=value=>Math.round(value).toLocaleString()}else if(item.number===19){rows=agents.filter(row=>Number.isFinite(row.detractors)).map(row=>({...row,value:row.detractors})).sort((a,b)=>b.value-a.value);metric='Detractors';formatter=value=>Math.round(value).toLocaleString()}answer=rows.length?qaTopText(rows,metric,formatter):answer;return {answer,metric,status,evidence:lensEvidenceRows(rows,metric,formatter)}}
function answerOpsLens(item){const target=num(state.rules.target),teams=managerRowsSummary(),groups=managerPeriodGroups(),scoreRows=teams.filter(row=>Number.isFinite(row.score)).map(row=>({...row,value:row.score})),above=scoreRows.filter(row=>row.score>=target),below=scoreRows.filter(row=>row.score<target);let rows=[],metric='NPS',formatter=value=>Number.isFinite(value)?fmt(value):'n/a',answer='Not enough mapped team evidence is available for this calculation.',status='Directional';if(item.number===1){rows=groups.map(group=>{const met=group.periods.filter(row=>row.score>=target).length;return {name:group.agent,value:group.periods.length?met/group.periods.length*100:NaN,responses:group.periods.length,score:group.periods.at(-1)?.score}}).sort((a,b)=>b.value-a.value);metric='Target Achievement Rate';formatter=value=>`${fmt(value)}%`}else if(item.number===2){rows=groups.map(group=>{const met=group.periods.filter(row=>row.score>=target).length;return {name:group.agent,value:group.periods.length?met/group.periods.length*100:NaN,responses:group.periods.length,score:group.periods.at(-1)?.score}}).sort((a,b)=>a.value-b.value);metric='Target Achievement Rate';formatter=value=>`${fmt(value)}%`}else if([3,7,13,15].includes(item.number)){rows=qaGroupMovementRows(groups,true);metric='Improvement';formatter=value=>`${signed(value)} pts`}else if([4,14,19].includes(item.number)){rows=qaGroupMovementRows(groups,false).map(row=>({...row,value:Math.abs(row.value)}));metric='Decline';formatter=value=>`-${fmt(value)} pts`}else if(item.number===5)rows=scoreRows.sort((a,b)=>b.score-a.score);else if(item.number===6){rows=qaVolatilityRows(groups,false);metric='Period SD';formatter=value=>`${fmt(value)} pts`}else if(item.number===8||item.number===20){rows=qaBusinessImpactRows(teams,target);metric='Impact Score'}else if(item.number===9||item.number===10){rows=managerAgentDistribution().sort((a,b)=>item.number===9?b.value-a.value:a.value-b.value);metric='Agents Meeting Target';formatter=value=>`${fmt(value)}%`}else if(item.number===11){rows=managerAgentDistribution().map(row=>({...row,value:Number.isFinite(row.latest)&&Number.isFinite(row.first)?row.latest-row.first:NaN})).sort((a,b)=>b.value-a.value);metric='Agent Score Spread';formatter=value=>`${fmt(value)} pts`}else if(item.number===12){rows=teams.filter(row=>Number.isFinite(row.responses)).map(row=>({...row,value:row.responses})).sort((a,b)=>b.value-a.value);metric='Survey Volume';formatter=value=>Math.round(value).toLocaleString()}else if(item.number===16){rows=qaRecoveryRows(groups,target);metric='Recovery';formatter=value=>`${signed(value)} pts`}else if(item.number===17){rows=teams.filter(row=>Number.isFinite(row.promoters)).map(row=>({...row,value:row.promoters})).sort((a,b)=>b.value-a.value);metric='Promoters';formatter=value=>Math.round(value).toLocaleString()}else if(item.number===18){rows=teams.filter(row=>Number.isFinite(row.detractors)).map(row=>({...row,value:row.detractors})).sort((a,b)=>b.value-a.value);metric='Detractors';formatter=value=>Math.round(value).toLocaleString()}answer=rows.length?qaTopText(rows,metric,formatter):answer;return {answer,metric,status,evidence:lensEvidenceRows(rows,metric,formatter)}}

function clientLensField(row,names){for(const name of names){if(row&&row[name]!==undefined&&row[name]!==null&&String(row[name]).trim()!=='')return row[name]}return ''}
function clientSegmentRows(names){
 const map={};
 qaRawRows().forEach(row=>{
  const name=String(clientLensField(row,names)||'').trim();
  if(!name)return;
  const bucket=(map[name]||={name,values:[],responses:0,promoters:0,detractors:0});
  const score=qaAgentScore(row),band=qaNpsBand(row);
  bucket.responses+=1;
  if(Number.isFinite(score))bucket.values.push(score);
  if(band==='Promoter')bucket.promoters+=1;
  else if(band==='Detractor')bucket.detractors+=1;
 });
 return Object.values(map).map(row=>{
  const derived=row.values.length?avg(row.values):(row.responses?(row.promoters/row.responses*100-row.detractors/row.responses*100):NaN);
  return {...row,score:derived,value:derived};
 }).filter(row=>row.name);
}
function clientThemeRows(positive=true){const rows=typeof analyzedOutputRows==='function'?analyzedOutputRows():customRawRows(),themes=typeof analyzedOutputDistribution==='function'?analyzedOutputDistribution(rows,['Primary Reason','Owl Primary Driver','Primary Theme','Theme','Predicted Theme','Owl Theme','Driver','Reason']):[];return themes.map(item=>({name:item.label||item.name,value:item.count||0,responses:item.count||0,score:item.percent})).filter(row=>row.name).sort((a,b)=>b.value-a.value)}
function clientPeriodRows(){const periods=analysisPeriods().map(row=>({name:rowPeriodName(row)||row.name||row.label||'Period',score:num(row?.NPS??row?.nps??row?.CSAT??row?.csat??row?.Score??row?.score),responses:rowResponses(row)})).filter(row=>Number.isFinite(row.score)||Number.isFinite(row.responses));return periods}
function clientSegmentMovement(names,positive=true){const rows=qaRawRows(),groups={};rows.forEach(row=>{const name=String(clientLensField(row,names)||'').trim(),period=rowPeriodName(row);if(!name||!period)return;const score=qaAgentScore(row);if(!Number.isFinite(score))return;const bucket=(groups[name]||={name,periods:{}});(bucket.periods[period]||=[]).push(score)});return Object.values(groups).map(group=>{const periods=Object.keys(group.periods).sort().map(period=>({period,score:avg(group.periods[period])}));return {name:group.name,value:periods.length>=2?periods.at(-1).score-periods[0].score:NaN,responses:periods.length,score:periods.at(-1)?.score}}).filter(row=>Number.isFinite(row.value)).sort((a,b)=>positive?b.value-a.value:a.value-b.value)}
function answerClientLens(item){
 const m=readoutMetrics(),target=num(state.rules.target),periods=clientPeriodRows(),reason=readoutReason(),sent=readoutSentiment(),minSample=Number(state.rules.minimumSample||10);
 let rows=[],metric='Client Lens',formatter=value=>Number.isFinite(value)?fmt(value):'n/a',answer='This card needs additional mapped client, segment, period, theme, or operational evidence in the completed payload.',status='Directional';
 if(item.number===1){
  const gap=Number.isFinite(m.gap)?m.gap:(Number.isFinite(m.overall)&&Number.isFinite(target)?m.overall-target:NaN);
  answer=Number.isFinite(gap)?`${gap>=0?'Meeting':'Missing'} target by ${signed(gap)} pts. Current score is ${fmt(m.overall)} against target ${fmt(target)}.`:'Target or current score is not available for this run.';
  rows=[{name:'Current reporting period',value:gap,score:m.overall,responses:m.total}];metric='Target Variance';formatter=value=>`${signed(value)} pts`;
 }else if(item.number===2){
  rows=periods.filter(row=>Number.isFinite(row.score)&&Number.isFinite(target)).map(row=>({...row,value:row.score>=target?1:0}));const met=rows.filter(row=>row.value).length;answer=rows.length?`${met} of ${rows.length} reporting period(s) met or exceeded target.`:answer;metric='Target Met';formatter=value=>value?'Met':'Missed';
 }else if(item.number===3){
  if(periods.length>=2&&Number.isFinite(periods[0].score)&&Number.isFinite(periods.at(-1).score)){const delta=periods.at(-1).score-periods[0].score;answer=`Customer experience is ${delta>0?'improving':delta<0?'declining':'stable'} by ${signed(delta)} pts from first to latest period.`;rows=[{name:'First to latest',value:delta,score:periods.at(-1).score,responses:periods.at(-1).responses}];metric='Movement';formatter=value=>`${signed(value)} pts`;}
 }else if(item.number===4){
  const scores=periods.map(row=>row.score).filter(Number.isFinite),sd=std(scores);answer=scores.length>=2?`Performance consistency is ${sd<=5?'strong':sd<=12?'moderate':'volatile'} with ${fmt(sd)} pts standard deviation across ${scores.length} period(s).`:answer;rows=periods.map(row=>({...row,value:row.score}));metric='Period Score';
 }else if(item.number===5){
  rows=periods.filter(row=>Number.isFinite(row.score)&&Number.isFinite(target)).map(row=>({...row,value:row.score-target}));const variance=avg(rows.map(row=>row.value).filter(Number.isFinite));answer=rows.length?`Average variance to target is ${signed(variance)} pts across ${rows.length} reporting period(s).`:answer;metric='Variance to Target';formatter=value=>`${signed(value)} pts`;
 }else if(item.number===6||item.number===7){
  rows=clientSegmentMovement(['Customer Segment','Segment','Customer Type','Customer Entitlement','Region','Market'],item.number===6);metric=item.number===6?'Improvement':'Decline';formatter=value=>`${signed(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):answer;
 }else if(item.number===8){
  rows=clientSegmentRows(['Channel','Contact Channel','Survey Channel']).sort((a,b)=>b.score-a.score);metric='Average Score';answer=rows.length?qaTopText(rows,metric,formatter):answer;
 }else if(item.number===9){
  rows=clientSegmentRows(['Region','Geo','Market','Country']).sort((a,b)=>b.score-a.score);metric='Average Score';answer=rows.length?qaTopText(rows,metric,formatter):answer;
 }else if(item.number===10){
  rows=clientSegmentRows(['Product','Product Name','Line of Business','LOB']).sort((a,b)=>b.score-a.score);metric='Average Score';answer=rows.length?qaTopText(rows,metric,formatter):answer;
 }else if([11,12,13,14,15].includes(item.number)){
  rows=clientThemeRows(item.number===11);metric=item.number===15?'Detractor Issue Count':'Theme Mentions';formatter=value=>Math.round(value).toLocaleString();answer=rows.length?qaTopText(rows,metric,formatter):`The leading driver is ${reason.label}; theme output is limited in this run.`;
 }else if(item.number===16){
  const movement=Number.isFinite(m.movement)?m.movement:NaN;answer=Number.isFinite(movement)?`Latest completed period changed by ${signed(movement)} pts versus the prior period; use intervention dates to attribute the gain to a specific improvement.`:'Improvement attribution needs intervention dates and at least two comparable periods.';rows=[{name:'Latest vs prior',value:movement,score:m.overall,responses:m.total}];metric='Period Gain';formatter=value=>`${signed(value)} pts`;
 }else if(item.number===17){
  rows=clientSegmentRows(['Customer Segment','Segment','Customer Type','Region','Market']).map(row=>({...row,value:row.responses*Math.max(0,Number.isFinite(target)&&Number.isFinite(row.score)?target-row.score:0)})).sort((a,b)=>b.value-a.value);metric='Impact Score';answer=rows.length?qaTopText(rows,metric,formatter):answer;
 }else if(item.number===18||item.number===22){
  const corr=vpCorrelation(periods.map(row=>row.responses),periods.map(row=>row.score));answer=Number.isFinite(corr)?`Survey volume and score correlation is ${fmt(corr)}, which is ${Math.abs(corr)>=0.5?'a meaningful directional relationship':'not a strong relationship'} in this run.`:'Correlation needs at least three periods with both score and volume.';rows=periods.map(row=>({...row,value:row.responses}));metric='Volume';
 }else if(item.number===19){
  const delta=periods.length>=2&&Number.isFinite(periods[0].responses)&&Number.isFinite(periods.at(-1).responses)?periods.at(-1).responses-periods[0].responses:NaN;answer=Number.isFinite(delta)?`Survey participation is ${delta>0?'increasing':delta<0?'declining':'stable'} by ${signed(delta)} responses from first to latest period.`:answer;rows=periods.map(row=>({...row,value:row.responses}));metric='Responses';formatter=value=>Math.round(value).toLocaleString();
 }else if(item.number===20){
  answer='Response rate trend needs response-rate fields in the uploaded data; response counts are available as a proxy only.';rows=periods.map(row=>({...row,value:row.responses}));metric='Response Count Proxy';formatter=value=>Number.isFinite(value)?Math.round(value).toLocaleString():'n/a';
 }else if(item.number===21){
  answer=Number.isFinite(m.total)?`${Math.round(m.total).toLocaleString()} responses are available; this is ${m.total>=minSample?'above':'below'} the configured minimum sample of ${minSample}.`:'Sample size is not available.';rows=[{name:'Current sample',value:m.total,score:m.overall,responses:m.total}];metric='Responses';formatter=value=>Math.round(value).toLocaleString();
 }else if(item.number===23){
  rows=clientSegmentRows(['Region','Geo','Market','Country']).map(row=>({...row,value:row.promoters})).sort((a,b)=>b.value-a.value);metric='Promoters';formatter=value=>Math.round(value).toLocaleString();answer=rows.length?qaTopText(rows,metric,formatter):answer;
 }else if(item.number===24){
  rows=clientSegmentRows(['Region','Geo','Market','Country']).map(row=>({...row,value:row.detractors})).sort((a,b)=>b.value-a.value);metric='Detractors';formatter=value=>Math.round(value).toLocaleString();answer=rows.length?qaTopText(rows,metric,formatter):answer;
 }else if(item.number===25){
  rows=clientSegmentRows(['Customer Type','Customer Segment','Segment','Customer Entitlement']).sort((a,b)=>a.score-b.score);metric='Average Score';answer=rows.length?qaTopText(rows,metric,formatter):answer;
 }else if(item.number===26){
  rows=clientSegmentMovement(['Product','Product Name','Line of Business','LOB'],false);metric='Product Decline';formatter=value=>`${signed(value)} pts`;answer=rows.length?qaTopText(rows,metric,formatter):answer;
 }
 return {answer,metric,status,evidence:lensEvidenceRows(rows,metric,formatter)};
}
function workbookLensLabel(lens){return lens==='tl'?'TL Lens':lens==='ops'?'Operations Manager Lens':lens==='client'?'Client Lens':'Workbook Lens'}
function workbookLensStatusLabel(lens){return lens==='tl'?'TL LENS':lens==='ops'?'OPS MANAGER LENS':lens==='client'?'CLIENT LENS':'WORKBOOK LENS'}

function workbookLensBank(lens){return lens==='tl'?tlLensQuestionBank:lens==='client'?clientLensQuestionBank:opsLensQuestionBank}
function workbookLensAnswer(lens,item){return lens==='tl'?answerTlLens(item):lens==='client'?answerClientLens(item):answerOpsLens(item)}
function renderWorkbookLensContent(lens){const bank=workbookLensBank(lens),label=workbookLensLabel(lens);return `<section class="lens-readout qa-lens-readout workbook-lens-readout"><div class="qa-lens-question-grid">${bank.map((item,index)=>{const result=workbookLensAnswer(lens,item);return `<article class="qa-lens-question-card"><div class="qa-lens-card-head"><span>${item.number}</span><div><small>${escapeHtml(item.category)}</small><h3>${escapeHtml(item.question)}</h3></div><button class="qa-lens-info-button" type="button" data-workbook-lens="${lens}" data-workbook-info="${index}" title="View logic and calculation" aria-label="View logic and calculation">i</button></div><div class="qa-lens-answer"><small>Answer</small><p>${escapeHtml(result.answer)}</p></div></article>`}).join('')}</div></section>`}
function showWorkbookLensDetail(lens,index){const item=workbookLensBank(lens)[index],result=workbookLensAnswer(lens,item);if(!item)return;$('evidenceStatus').textContent=`${workbookLensStatusLabel(lens)} ${item.number} - ${result.status||'SUPPORTING EVIDENCE'}`;$('evidenceTitle').textContent=item.question;$('evidenceAnswer').textContent=result.answer;$('evidenceMethod').textContent='Calculated from the completed NPS analysis payload and the uploaded lens workbook definition.';$('evidenceDerived').textContent=result.answer;$('evidenceLogic').textContent=item.logic;$('evidenceStatistics').textContent=result.metric||'Lens ranking';$('evidenceGuardrail').textContent=item.considerations||'Interpret with mapped fields, target, and minimum sample settings.';const rows=result.evidence||[];if(!rows.length){$('evidenceTable').innerHTML='<p class="table-hint">This card needs additional mapped data or period history that is not available in the current completed payload.</p>'}else{const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))].slice(0,8);$('evidenceTable').innerHTML=`<h3 class="evidence-data-title">Actual calculation rows</h3><div class="results-table-wrap"><table class="evidence-table"><thead><tr>${columns.map(column=>`<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(column=>`<td>${escapeHtml(row[column]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}const dialog=$('evidenceDialog');if(!dialog.open)dialog.showModal()}
function bindWorkbookLensCards(){document.querySelectorAll('[data-workbook-info]').forEach(button=>button.onclick=event=>{event.preventDefault();event.stopPropagation();showWorkbookLensDetail(button.dataset.workbookLens,Number(button.dataset.workbookInfo))})}
function vpLensValue(value, fallback='n/a'){
 if(value===null||value===undefined||value==='')return fallback;
 if(typeof value==='number')return Number.isFinite(value)?fmt(value):fallback;
 return String(value);
}
function vpLensPct(value){return Number.isFinite(value)?`${fmt(value)}%`:'n/a'}
function vpLensNum(value){return Number.isFinite(value)?Math.round(value).toLocaleString():'n/a'}
function vpRollingAvg(periods, count, offset=0){
 const slice=periods.slice(Math.max(0,periods.length-count-offset), periods.length-offset).map(row=>row.nps).filter(Number.isFinite);
 return slice.length?avg(slice):NaN;
}
function vpStreak(periods,target,met=true){
 if(!Number.isFinite(target))return 0;
 let best=0,current=0;
 periods.forEach(period=>{const ok=Number.isFinite(period.nps)&&(met?period.nps>=target:period.nps<target);current=ok?current+1:0;best=Math.max(best,current)});
 return best;
}
function vpCorrelation(xs,ys){
 const pairs=xs.map((x,i)=>[Number(x),Number(ys[i])]).filter(([x,y])=>Number.isFinite(x)&&Number.isFinite(y));
 if(pairs.length<3)return NaN;
 const ax=avg(pairs.map(p=>p[0])),ay=avg(pairs.map(p=>p[1]));
 const nume=pairs.reduce((s,[x,y])=>s+(x-ax)*(y-ay),0);
 const denx=Math.sqrt(pairs.reduce((s,[x])=>s+(x-ax)**2,0));
 const deny=Math.sqrt(pairs.reduce((s,[,y])=>s+(y-ay)**2,0));
 return denx&&deny?nume/(denx*deny):NaN;
}
function vpTopLabels(dist,limit=3){
 return (dist||[]).slice(0,limit).map(item=>item.label||item.name||'').filter(Boolean).join(', ')||'Not available';
}
function vpNpsBuckets(total){
 const a=state.analysis||{},summary=a.summary||{},counts=a.counts||{};
 return npsBucketCountsFromSummary(summary,counts,total);
}
function vpLensSections(){
 const m=readoutMetrics(),sent=readoutSentiment(),reason=readoutReason(),periods=m.periods||[],total=m.total;
 const latest=m.latest,prev=m.previous,target=m.target;
 const last12=periods.slice(-12);
 const weeksMet=Number.isFinite(target)?last12.filter(row=>Number.isFinite(row.nps)&&row.nps>=target).length:NaN;
 const targetPct=last12.length&&Number.isFinite(weeksMet)?weeksMet/last12.length*100:NaN;
 const deltas=last12.map(row=>Number.isFinite(row.nps)&&Number.isFinite(target)?row.nps-target:NaN).filter(Number.isFinite);
 const avgDelta=deltas.length?avg(deltas):NaN,bestDelta=deltas.length?Math.max(...deltas):NaN,worstDelta=deltas.length?Math.min(...deltas):NaN;
 const avg4=vpRollingAvg(periods,4),prev4=vpRollingAvg(periods,4,4),weeklyRate=periods.length>=2?(periods.at(-1).nps-periods[0].nps)/Math.max(1,periods.length-1):NaN;
 const best=periods.length?[...periods].sort((a,b)=>b.nps-a.nps)[0]:null,weak=periods.length?[...periods].sort((a,b)=>a.nps-b.nps)[0]:null;
 const volumes=periods.map(row=>row.responses).filter(Number.isFinite),avgVolume=volumes.length?avg(volumes):NaN;
 const highVol=periods.filter(row=>Number.isFinite(row.responses)).sort((a,b)=>b.responses-a.responses)[0];
 const lowVol=periods.filter(row=>Number.isFinite(row.responses)).sort((a,b)=>a.responses-b.responses)[0];
 const latestVol=latest&&prev&&Number.isFinite(latest.responses)&&Number.isFinite(prev.responses)?latest.responses-prev.responses:NaN;
 const margin=Number.isFinite(total)&&total>0?1.96*Math.sqrt(0.25/total)*100:NaN;
 const corrVol=vpCorrelation(periods.map(p=>p.responses),periods.map(p=>p.nps));
 const buckets=vpNpsBuckets(total),promoters=buckets.promoters,passives=buckets.passives,detractors=buckets.detractors;
 const promoterPct=Number.isFinite(promoters)&&Number.isFinite(total)&&total?promoters/total*100:NaN;
 const passivePct=Number.isFinite(passives)&&Number.isFinite(total)&&total?passives/total*100:NaN;
 const detractorPct=Number.isFinite(detractors)&&Number.isFinite(total)&&total?detractors/total*100:NaN;
 const rows=typeof analyzedOutputRows==='function'?analyzedOutputRows():customRawRows();
 const themes=typeof analyzedOutputDistribution==='function'?analyzedOutputDistribution(rows,['Primary Reason','Owl Primary Driver','Primary Theme','Theme','Predicted Theme','Owl Theme','Driver','Reason']):[];
 const acpt=typeof analyzedOutputDistribution==='function'?analyzedOutputDistribution(rows,['ACPT Primary Category','ACPT','Predicted ACPT','Owl ACPT','Ownership','Accountability','Bucket Category','Owl Customer Impact']):[];
 const resolutions=typeof analyzedOutputDistribution==='function'?analyzedOutputDistribution(rows,['Owl Resolution Status','Resolution Status','Predicted Resolution','Owl Resolution Status','Resolution']):[];
 const topPositive=Number.isFinite(sent.positive)&&sent.positive>0?`${fmt(sent.positive)}% positive sentiment`:'Positive theme not available';
 const topNegative=Number.isFinite(sent.negative)&&sent.negative>0?`${fmt(sent.negative)}% negative sentiment`:'Negative theme not available';
 const volumeDirection=Number.isFinite(latestVol)?latestVol>0?'increased':latestVol<0?'declined':'remained stable':'needs more period data';
 const targetState=Number.isFinite(m.gap)?m.gap>=0?'above target':'below target':'target not available';
 const loyaltyState=Number.isFinite(m.movement)?m.movement>0?'improving':m.movement<0?'declining':'stable':'needs another period';
 const sections=[
  {title:'Executive Summary',kpis:[['Current NPS',fmt(m.overall)],['Target NPS',vpLensValue(target)],['Variance to Target',Number.isFinite(m.gap)?`${signed(m.gap)} pts`:'n/a'],['Previous Period NPS',prev?fmt(prev.nps):'n/a'],['Period Change',Number.isFinite(m.movement)?`${signed(m.movement)} pts`:'n/a'],['Survey Responses',vpLensNum(total)],['Response Rate','Not available']],readout:`Overall NPS stands at ${fmt(m.overall)}, representing ${Number.isFinite(m.movement)?`${signed(m.movement)} point change`:'an unavailable period change'} from the previous reporting period and ${Number.isFinite(m.gap)?`${Math.abs(m.gap).toFixed(2)} points ${m.gap>=0?'above':'below'} target`:'no target variance available'}. Customer advocacy is ${loyaltyState}.`},
  {title:'Performance Against Target',kpis:[['Weeks Meeting Target (Last 12 Weeks)',Number.isFinite(weeksMet)?String(weeksMet):'n/a'],['Target Achievement %',vpLensPct(targetPct)],['Average Delta to Target',Number.isFinite(avgDelta)?`${signed(avgDelta)} pts`:'n/a'],['Best Delta',Number.isFinite(bestDelta)?`${signed(bestDelta)} pts`:'n/a'],['Worst Delta',Number.isFinite(worstDelta)?`${signed(worstDelta)} pts`:'n/a'],['Longest Success Streak',String(vpStreak(last12,target,true))],['Longest Miss Streak',String(vpStreak(last12,target,false))]],readout:`The organization achieved its NPS target in ${Number.isFinite(weeksMet)?weeksMet:'n/a'} of the last ${last12.length||12} weeks, maintaining an average performance of ${Number.isFinite(avgDelta)?`${Math.abs(avgDelta).toFixed(2)} points ${avgDelta>=0?'above':'below'} target`:'n/a'}. Target achievement is ${Number.isFinite(targetPct)?targetPct>=75?'consistent':targetPct>=40?'variable':'inconsistent':'not available'}.`},
  {title:'Trend & Momentum',kpis:[['Weekly Trend',m.trend],['Rolling 4-Week Average',fmt(avg4)],['Previous 4-Week Average',fmt(prev4)],['Weekly Improvement Rate',Number.isFinite(weeklyRate)?`${signed(weeklyRate)} pts/week`:'n/a'],['Trend Direction',m.trend]],readout:`NPS momentum over the past four weeks indicates customer advocacy is ${Number.isFinite(avg4)&&Number.isFinite(prev4)?avg4>=prev4?'accelerating or strengthening':'slowing or weakening':'not fully measurable'}, with an average movement of ${Number.isFinite(weeklyRate)?signed(weeklyRate):'n/a'} points per week. The overall trend suggests performance is ${m.trend.toLowerCase()}.`},
  {title:'Performance Stability',kpis:[['Standard Deviation',fmt(m.sd)],['Stability Rating',m.consistency],['Weekly Variability',m.variability],['Best Week',best?`${fmt(best.nps)} (${best.name})`:'n/a'],['Worst Week',weak?`${fmt(weak.nps)} (${weak.name})`:'n/a']],readout:`Customer experience performance remains ${m.consistency.toLowerCase()} / ${m.variability.toLowerCase()}, suggesting recent results are ${m.consistency==='High'?'consistently sustained':'subject to operational variation'}.`},
  {title:'Survey Volume & Statistical Confidence',kpis:[['Survey Responses',vpLensNum(total)],['Response Rate','Not available'],['Volume Trend',volumeDirection],['Average Weekly Volume',fmt(avgVolume)],['Highest Volume Week',highVol?`${vpLensNum(highVol.responses)} (${highVol.name})`:'n/a'],['Lowest Volume Week',lowVol?`${vpLensNum(lowVol.responses)} (${lowVol.name})`:'n/a'],['Margin of Error',Number.isFinite(margin)?`+/- ${fmt(margin)} pts`:'n/a'],['Confidence Level',m.confidence]],readout:`Survey participation has ${volumeDirection} over the reporting period. Current response levels provide ${m.confidence.toLowerCase()} statistical confidence that the reported NPS represents customer sentiment.`},
  {title:'Correlation Analysis',kpis:[['Volume <-> NPS',Number.isFinite(corrVol)?fmt(corrVol):'n/a'],['Volume <-> Promoters','Not available'],['Volume <-> Detractors','Not available'],['Response Rate <-> NPS','Not available'],['Sentiment <-> NPS',Number.isFinite(sent.positive)||Number.isFinite(sent.negative)?'Directional':'Not available'],['Operational Metric <-> NPS','Depends on mapped fields']],readout:`Correlation analysis indicates survey participation ${Number.isFinite(corrVol)&&Math.abs(corrVol)>=0.5?'may materially influence':'does not clearly prove influence on'} NPS performance. The strongest available relationship is volume to NPS when weekly volume data exists.`},
  {title:'Customer Mix',kpis:[['Promoters %',vpLensPct(promoterPct)],['Passives %',vpLensPct(passivePct)],['Detractors %',vpLensPct(detractorPct)],['Promoter Growth','Needs prior mix'],['Detractor Growth','Needs prior mix']],readout:`The customer base comprises ${vpLensPct(promoterPct)} Promoters, ${vpLensPct(passivePct)} Passives, and ${vpLensPct(detractorPct)} Detractors. Changes in customer mix indicate overall loyalty is ${loyaltyState}.`},
  {title:'Voice of Customer',kpis:[['Top Positive Themes',topPositive],['Top Negative Themes',topNegative],['Emerging Themes',vpTopLabels(themes,3)],['Theme Trend',themes.length?'Available':'Not available']],readout:`Customer feedback highlights ${vpTopLabels(themes,1)} as a key theme, while concerns related to ${reason.label} should be watched during the reporting period.`},
  {title:'Team Performance',kpis:[['Team Rankings',m.bestManager||m.weakManager?'Available':'Needs manager mapping'],['Team NPS',m.bestManager?entityRaw(m.bestManager,'n/a'):'n/a'],['Team Improvement',m.mostImprovedManager?entityRaw(m.mostImprovedManager,'n/a'):'n/a'],['Target Achievement by Team','Use manager summary']],readout:`Performance varies across teams where manager mapping exists. ${m.bestManager?m.bestManager.name:'Top team'} is outperforming available peers while ${m.weakManager?m.weakManager.name:'the lowest team'} presents the largest opportunity for improvement.`},
  {title:'Agent Performance',kpis:[['Top Agents',m.bestAgent?entityRaw(m.bestAgent,'n/a'):'n/a'],['Bottom Agents',m.weakAgent?entityRaw(m.weakAgent,'n/a'):'n/a'],['Average Agent NPS',state.analysis?.agents?.length?fmt(avg(state.analysis.agents.map(r=>num(r['Agent NPS']??r.NPS??r.nps)).filter(Number.isFinite))):'n/a'],['Performance Distribution',m.bestAgent&&m.weakAgent?'Available':'Needs agent mapping']],readout:`Individual performance remains ${m.consistency==='High'?'consistent':'variable'}, indicating opportunities for targeted coaching and adoption of best practices.`},
  {title:'Customer Segmentation',kpis:[['Region','Use Custom Views'],['Product','Use Custom Views'],['Channel','Use Custom Views'],['Business Unit','Use Custom Views'],['Customer Type','Use Custom Views']],readout:'Customer advocacy may differ across business segments. Use Custom Views to compare region, product, channel, business unit, or customer type when those fields exist in the uploaded file.'},
  {title:'Detractor Analysis',kpis:[['Top Complaint Categories',reason.label],['Complaint Trend',m.trend],['Repeat Issues',vpTopLabels(themes,3)],['Detractor Concentration',vpLensPct(detractorPct)]],readout:`The majority of detractor risk should be reviewed around ${reason.label} and ${vpTopLabels(themes,3)}, highlighting the areas with the greatest potential to improve advocacy.`},
  {title:'Promoter Analysis',kpis:[['Top Advocacy Drivers',vpTopLabels(themes,3)],['Repeat Positive Themes',topPositive],['Strength Areas',m.bestAgent||m.bestManager?'Available':'Not mapped']],readout:`Customers recognize ${vpTopLabels(themes,3)} as recurring experience signals. Use promoter verbatims to preserve and replicate these strengths.`},
  {title:'Risks',kpis:[['Rising Detractors',Number.isFinite(detractorPct)?detractorPct>30?'Yes':'Monitor':'n/a'],['Falling Volume',Number.isFinite(latestVol)?latestVol<0?'Yes':'No':'n/a'],['Missed Targets',Number.isFinite(m.gap)?m.gap<0?'Yes':'No':'n/a'],['Performance Volatility',m.variability],['Emerging Negative Themes',vpTopLabels(themes,2)]],readout:`Current trends indicate ${m.outlook==='At Risk'?'high':m.outlook==='Neutral'?'moderate':'low'} risk to future NPS performance, primarily driven by ${reason.label}, target variance, and volatility.`},
  {title:'Opportunities',kpis:[['Highest Impact Driver',reason.label],['Quick Wins',vpTopLabels(acpt,2)],['Estimated Improvement Potential',Number.isFinite(m.gap)&&m.gap<0?`${fmt(Math.abs(m.gap))} pts to target`:'Protect current level'],['High-Impact Segments','Use Custom Views']],readout:`The greatest opportunity to improve customer advocacy lies in addressing ${reason.label}, while sustaining strengths in ${vpTopLabels(themes,2)}.`},
  {title:'Predictive Outlook',kpis:[['Forecast NPS',Number.isFinite(m.overall)&&Number.isFinite(weeklyRate)?fmt(m.overall+weeklyRate):'n/a'],['Probability of Meeting Target',Number.isFinite(m.gap)?(m.gap>=0?'High':m.gap>=-3?'Moderate':'Low'):'n/a'],['Forecast Trend',m.trend],['Confidence Score',m.confidence]],readout:`Based on current trends, NPS is projected to ${m.trend==='Improving'?'improve':m.trend==='Declining'?'decline':'remain stable'} over the next reporting period, with ${Number.isFinite(m.gap)?(m.gap>=0?'high':m.gap>=-3?'moderate':'low'):'unknown'} probability of meeting the established target.`}
 ];
 return sections;
}
function vpLensInsightRows(){return vpLensSections().map(section=>({title:section.title,finding:section.readout,why:`KPIs reviewed: ${section.kpis.map(item=>item[0]).join(', ')}.`,evidence:section.kpis.slice(0,5).map(([label,value])=>`${label}: ${value}`)}))}
function renderVpLensContent(){
 const sections=vpLensSections(),mode=state.vpLensMode||'all';
 const selected=value=>mode===value?'selected':'';
 return `<section class="lens-readout decision-readout vp-lens-readout vp-lens-sections-only vp-lens-mode-${escapeHtml(mode)}"><div class="vp-lens-toolbar"><label for="vpLensMode">View</label><select id="vpLensMode"><option value="all" ${selected('all')}>Show all</option><option value="cards" ${selected('cards')}>Show only cards</option><option value="summary" ${selected('summary')}>Show only executive summary</option></select></div><div class="vp-lens-section-grid">${sections.map((section,index)=>`<article class="vp-lens-section"><div class="vp-lens-section-head"><span>${index+1}</span><h3>${escapeHtml(section.title)}</h3></div><div class="vp-lens-kpi-block"><span class="vp-lens-block-label">Cards</span><div class="vp-lens-kpis">${section.kpis.map(([label,value])=>`<div><small>${escapeHtml(label)}</small><strong>${escapeHtml(String(value))}</strong></div>`).join('')}</div></div><div class="vp-lens-exec-summary"><span class="vp-lens-block-label">Executive Summary</span><p>${escapeHtml(section.readout)}</p></div></article>`).join('')}</div></section>`;
}
function bindVpLensMode(){
 const select=$('vpLensMode'),section=document.querySelector('.vp-lens-readout');
 if(!select||!section)return;
 select.onchange=()=>{
  state.vpLensMode=select.value;
  section.classList.remove('vp-lens-mode-all','vp-lens-mode-cards','vp-lens-mode-summary');
  section.classList.add(`vp-lens-mode-${select.value}`);
 };
}
function readoutCards(lens){const m=readoutMetrics(),reason=readoutReason();const weakest=m.periods.length?[...m.periods].sort((a,b)=>a.nps-b.nps)[0]:null;const action=lens==='qa'?'Audit detractor/passive records and ACPT/process tags':lens==='tl'?'Coach repeat low-score patterns with verbatim evidence':lens==='ops'?'Stabilize the weakest period and driver before broad coaching':lens==='client'?'Confirm recovery plan and next-period monitoring':'Protect the current business outcome and remove the biggest operating risk';return [
 {label:'Current Health',value:m.outlook,evidence:[`NPS ${fmt(m.overall)}`,Number.isFinite(m.gap)?`Target gap ${signed(m.gap)} pts`:'No target gap',Number.isFinite(m.total)?`n=${Math.round(m.total).toLocaleString()}`:'n/a']},
 {label:'Movement',value:m.trend,evidence:[m.latest?`Latest ${periodLine(m.latest)}`:'Latest period unavailable',m.previous?`Previous ${periodLine(m.previous)}`:'Previous period unavailable',Number.isFinite(m.movement)?`${signed(m.movement)} pts`:'Need 2 periods']},
 {label:'Biggest Risk',value:lens==='tl'?entityRaw(m.weakAgent,'Agent pattern not mapped'):lens==='ops'?entityRaw(m.weakManager,'Team concentration not mapped'):periodLine(weakest),evidence:[`Driver: ${reason.label}`,Number.isFinite(reason.count)?`Driver count ${Math.round(reason.count).toLocaleString()}`:'Driver count n/a',`Confidence ${m.confidence}`]},
 {label:'Action Focus',value:action,evidence:[`Consistency ${m.consistency}`,`Volatility ${m.variability}`,Number.isFinite(m.sd)?`Weekly SD ${fmt(m.sd)}`:'SD n/a']}
]}
function healthReadout(m,metric){const gapText=Number.isFinite(m.gap)?m.gap<0?`but it is ${fmt(Math.abs(m.gap))} pts below target`:m.gap>0?`and it is ${fmt(m.gap)} pts above target`:`and it is on target`:`with target gap not available`;const movementText=Number.isFinite(m.movement)?m.movement>0?`latest movement is up ${fmt(Math.abs(m.movement))} pts`:m.movement<0?`latest movement is down ${fmt(Math.abs(m.movement))} pts`:`latest movement is flat`:`latest movement needs another dated period`;return `The business is ${m.trend.toLowerCase()} with ${metric} at ${fmt(m.overall)}; ${gapText}, and ${movementText}.`}function lensLines(lens){if(lens==='vp')return vpLensInsightRows();if(lens==='qa')return qaLensInsightRows();const m=readoutMetrics(),reason=readoutReason(),sent=readoutSentiment();const weakestPeriod=m.periods.length?[...m.periods].sort((a,b)=>a.nps-b.nps)[0]:null;const bestPeriod=m.periods.length?[...m.periods].sort((a,b)=>b.nps-a.nps)[0]:null;const privateNames=lens!=='client';const tlAgent=privateNames?entityRaw(m.weakAgent,'Agent mapping not available'):'Agent-level detail withheld';const opsManager=privateNames?entityRaw(m.weakManager,'Manager/team mapping not available'):'Team-level detail withheld';const common=[
 {title:'Customer advocacy readout',finding:healthReadout(m,'NPS'),why:`Keep the discussion on the target gap, latest movement, and the action needed on ${reason.label}.`,evidence:[`NPS ${fmt(m.overall)}`,Number.isFinite(m.gap)?`Target gap ${signed(m.gap)} pts`:'Target gap n/a',Number.isFinite(m.total)?`Responses ${Math.round(m.total).toLocaleString()}`:'Responses n/a']},
 {title:'Recent movement needs a clear owner',finding:`The latest movement is ${Number.isFinite(m.movement)?signed(m.movement)+' pts':'not available'} and the trend reads ${m.trend}.`,why:'Assign the owner to the period, driver, or coaching action before the next review.',evidence:[m.latest?`Latest ${periodLine(m.latest)}`:'Latest period n/a',m.previous?`Previous ${periodLine(m.previous)}`:'Previous period n/a',`Trend ${m.trend}`]},
 {title:'The weakest period is the fastest audit sample',finding:`The lowest period is ${periodLine(weakestPeriod)}.`,why:'Start the audit from this slice before expanding to the full file.',evidence:[weakestPeriod?`Weakest ${weakestPeriod.name}`:'Weakest n/a',bestPeriod?`Best ${bestPeriod.name}`:'Best n/a',Number.isFinite(m.range)?`Range ${fmt(m.range)} pts`:'Range n/a']},
 {title:'Primary driver should anchor the action plan',finding:`The leading driver is ${reason.label}.`,why:'A driver-led action is more useful than a generic ï¿½improve NPSï¿½ message.',evidence:[`Driver ${reason.label}`,Number.isFinite(reason.count)?`Count ${Math.round(reason.count).toLocaleString()}`:'Count n/a',`Negative sentiment ${fmt(sent.negative)}%`]},
 {title:'Consistency shows whether this is isolated or systemic',finding:`Performance consistency is ${m.consistency} with ${Number.isFinite(m.sd)?fmt(m.sd)+' pts weekly SD':'limited dated evidence'}.`,why:'Use a targeted fix if the pattern is stable; review operating rhythm if volatility is high.',evidence:[`Consistency ${m.consistency}`,`Volatility ${m.variability}`,Number.isFinite(m.sd)?`SD ${fmt(m.sd)}`:'SD n/a']}
];const role={
 qa:[
  {title:'QA should audit the lowest advocacy slice first',finding:`Start with ${periodLine(weakestPeriod)} and detractor/passive records tied to ${reason.label}.`,why:'This creates a focused audit queue instead of a random sample.',evidence:[weakestPeriod?`Period ${weakestPeriod.name}`:'Period n/a',`Driver ${reason.label}`,`Negative ${fmt(sent.negative)}%`]},
  {title:'Audit for process evidence before coaching tone',finding:'Check resolution, documentation, policy, and handoff evidence before assigning behavior coaching.',why:'Low NPS can come from process friction even when the agent tone is acceptable.',evidence:[`ACPT/theme evidence available`,Number.isFinite(m.total)?`Rows ${Math.round(m.total).toLocaleString()}`:'Rows n/a',`Driver ${reason.label}`]},
  {title:'Use high-variance periods as calibration samples',finding:`Weekly spread is ${Number.isFinite(m.range)?fmt(m.range)+' pts':'not available'}, so calibration should include best and weakest periods.`,why:'Comparing strong and weak periods helps QA separate execution gaps from normal noise.',evidence:[bestPeriod?`Best ${periodLine(bestPeriod)}`:'Best n/a',weakestPeriod?`Weakest ${periodLine(weakestPeriod)}`:'Weakest n/a',Number.isFinite(m.range)?`Range ${fmt(m.range)}`:'Range n/a']},
  {title:'Close the loop with a recovery check',finding:'After audit actions, compare the next completed period against the current weakest period.',why:'The readout should prove whether the fix changed customer advocacy, not just whether action was taken.',evidence:[`Baseline ${weakestPeriod?weakestPeriod.name:'n/a'}`,`Current trend ${m.trend}`,`Confidence ${m.confidence}`]},
  {title:'QA summary for leadership',finding:`Audit priority is ${reason.label} in the lowest-scoring period.`,why:'This gives leadership a precise review queue with evidence.',evidence:[`NPS ${fmt(m.overall)}`,`Risk ${m.outlook}`,`Sample ${Number.isFinite(m.total)?Math.round(m.total).toLocaleString():'n/a'}`]}
 ],
 tl:[
  {title:'Coaching should be evidence-led',finding:`Primary coaching candidate: ${tlAgent}.`,why:'The TL view should only name agents when the data supports a focused coaching conversation.',evidence:[tlAgent,`Overall NPS ${fmt(m.overall)}`,`Minimum sample ${state.rules.minimumSample||10}`]},
  {title:'Coach the behavior linked to the driver',finding:`Use ${reason.label} verbatims as the coaching theme.`,why:'A named theme makes coaching actionable and reviewable.',evidence:[`Driver ${reason.label}`,Number.isFinite(reason.count)?`Count ${Math.round(reason.count)}`:'Count n/a',`Negative ${fmt(sent.negative)}%`]},
  {title:'Protect high performance while fixing lows',finding:`Best available performer is ${entityRaw(m.bestAgent,'not mapped')}.`,why:'A TL can use strong examples for peer learning, not only corrective action.',evidence:[entityRaw(m.bestAgent,'Best agent n/a'),entityRaw(m.weakAgent,'Weak agent n/a'),`Gap to target ${Number.isFinite(m.gap)?signed(m.gap):'n/a'}`]},
  {title:'Avoid one-off coaching from weak samples',finding:`Confidence is ${m.confidence}; verify sample size before performance action.`,why:'This protects agents and TLs from overreacting to small samples.',evidence:[`Responses ${Number.isFinite(m.total)?Math.round(m.total).toLocaleString():'n/a'}`,`Minimum sample ${state.rules.minimumSample||10}`,`Confidence ${m.confidence}`]},
  {title:'TL action for the next huddle',finding:`Review ${reason.label}, show two strong examples, and assign one measurable behavior.`,why:'The insight becomes a coaching routine instead of a dashboard observation.',evidence:[`Theme ${reason.label}`,`Trend ${m.trend}`,`Weakest ${weakestPeriod?weakestPeriod.name:'n/a'}`]}
 ],
 ops:[
  {title:'Operations should fix the operating condition first',finding:`Weakest period: ${periodLine(weakestPeriod)}.`,why:'Period concentration usually points to staffing, volume, process, routing, or policy conditions.',evidence:[weakestPeriod?`Weakest ${weakestPeriod.name}`:'Weakest n/a',Number.isFinite(m.movement)?`Latest movement ${signed(m.movement)}`:'Movement n/a',`Volatility ${m.variability}`]},
  {title:'Team concentration is useful only as an operating signal',finding:`Team/manager concentration: ${opsManager}.`,why:'Operations needs to know where to inspect workflow, not just who ranked low.',evidence:[opsManager,`Driver ${reason.label}`,`Consistency ${m.consistency}`]},
  {title:'Driver concentration should guide the fix',finding:`The operational fix should start with ${reason.label}.`,why:'This links actions to customer pain rather than generic performance management.',evidence:[`Driver ${reason.label}`,Number.isFinite(reason.count)?`Count ${Math.round(reason.count)}`:'Count n/a',`Negative ${fmt(sent.negative)}%`]},
  {title:'Volatility changes the management response',finding:`Operational variability is ${m.variability}.`,why:'High volatility means the process needs control; stable low performance means the process needs redesign or coaching.',evidence:[`Weekly SD ${Number.isFinite(m.sd)?fmt(m.sd):'n/a'}`,`Range ${Number.isFinite(m.range)?fmt(m.range):'n/a'}`,`Trend ${m.trend}`]},
  {title:'Operations action for this week',finding:'Inspect weakest-period staffing, queue, policy, and resolution handoff before broad coaching.',why:'It narrows the operating review to the most likely controllable levers.',evidence:[`Period ${weakestPeriod?weakestPeriod.name:'n/a'}`,`Driver ${reason.label}`,`Outlook ${m.outlook}`]}
 ],
 vp:[
  {title:'Executive message should be about business health',finding:`Customer advocacy is ${m.outlook.toLowerCase()} with NPS at ${fmt(m.overall)}.`,why:'A VP needs the decision state, not internal manager rankings.',evidence:[`NPS ${fmt(m.overall)}`,Number.isFinite(m.gap)?`Target gap ${signed(m.gap)} pts`:'Target gap n/a',`Confidence ${m.confidence}`]},
  {title:'The business risk is period and driver concentration',finding:`Biggest risk: ${periodLine(weakestPeriod)} tied to ${reason.label}.`,why:'This frames the risk as an operating condition leadership can sponsor.',evidence:[weakestPeriod?`Period ${weakestPeriod.name}`:'Period n/a',`Driver ${reason.label}`,Number.isFinite(reason.count)?`Count ${Math.round(reason.count)}`:'Count n/a']},
  {title:'Leadership ask should be explicit',finding:`Sponsor recovery on ${reason.label} and monitor the next reporting period.`,why:'The readout should produce a leadership ask, not just describe the result.',evidence:[`Trend ${m.trend}`,`Movement ${Number.isFinite(m.movement)?signed(m.movement):'n/a'}`,`Volatility ${m.variability}`]},
  {title:'Do not over-rotate on people unless the pattern is concentrated',finding:'Manager or agent names should stay out of the VP story unless they explain the business movement.',why:'VP attention belongs on operating risk, customer impact, and recovery accountability.',evidence:[`Rows ${Number.isFinite(m.total)?Math.round(m.total).toLocaleString():'n/a'}`,`Driver ${reason.label}`,`Weakest period ${weakestPeriod?weakestPeriod.name:'n/a'}`]},
  {title:'Executive action for the next review',finding:'Ask Operations for root cause, QA for audit findings, and TLs for coaching closure only where evidence supports it.',why:'This turns the insight into a cross-functional operating cadence.',evidence:[`QA sample ${weakestPeriod?weakestPeriod.name:'n/a'}`,`Ops driver ${reason.label}`,`TL sample guardrail ${state.rules.minimumSample||10}`]}
 ],
 client:[
  {title:'Client narrative should be clean and external-ready',finding:`NPS is ${fmt(m.overall)} with a ${m.outlook.toLowerCase()} outlook.`,why:'The client needs confidence, risk, and action without internal hierarchy noise.',evidence:[`NPS ${fmt(m.overall)}`,`Responses ${Number.isFinite(m.total)?Math.round(m.total).toLocaleString():'n/a'}`,`Confidence ${m.confidence}`]},
  {title:'Customer-impact risk is the weakest period',finding:`The lowest customer advocacy period is ${periodLine(weakestPeriod)}.`,why:'This is the simplest shared reference point for client discussion.',evidence:[weakestPeriod?`Weakest ${weakestPeriod.name}`:'Weakest n/a',bestPeriod?`Best ${bestPeriod.name}`:'Best n/a',`Range ${Number.isFinite(m.range)?fmt(m.range):'n/a'}`]},
  {title:'Action plan should focus on the driver',finding:`The action theme is ${reason.label}.`,why:'Driver language makes the plan customer-centered instead of internally defensive.',evidence:[`Driver ${reason.label}`,Number.isFinite(reason.count)?`Count ${Math.round(reason.count)}`:'Count n/a',`Negative sentiment ${fmt(sent.negative)}%`]},
  {title:'Recovery should be measured next period',finding:'Use the next completed reporting period as the recovery checkpoint.',why:'This gives the client a clear follow-up measure.',evidence:[`Baseline ${weakestPeriod?weakestPeriod.name:'n/a'}`,`Current trend ${m.trend}`,`Movement ${Number.isFinite(m.movement)?signed(m.movement):'n/a'}`]},
  {title:'External summary',finding:`The operation is ${m.trend.toLowerCase()} and focused on ${reason.label}.`,why:'A concise summary helps the client understand both state and action.',evidence:[`Outlook ${m.outlook}`,`Consistency ${m.consistency}`,`No employee names shown`]}
 ]};return common.concat(role[lens]||role.qa).slice(0,10)}
const lensConfig=[['qa','QA Lens'],['tl','TL Lens'],['ops','Operations Manager Lens'],['vp','VP Lens'],['client','Client Lens']];
function lensDisplayName(lens){return lensConfig.find(item=>item[0]===lens)?.[1]||'Insights Lens'}
function lensStrongInsights(lens){
 if(lens==='qa')return qaLensQuestionBank.map(item=>{const result=qaAnswerForQuestion(item);return {title:item.question,answer:result.answer,evidence:`${item.category} | ${result.metric||'Agent ranking'}`}}).filter(item=>!/not enough|requires|needs|not available/i.test(item.answer)).slice(0,10);
 if(lens==='tl'||lens==='ops'||lens==='client')return workbookLensBank(lens).map(item=>{const result=workbookLensAnswer(lens,item);return {title:item.question,answer:result.answer,evidence:`${item.category} | ${result.metric||'Lens ranking'}`}}).filter(item=>!/not enough|requires|needs|not available/i.test(item.answer)).slice(0,10);
 if(lens==='vp')return vpLensSections().slice(0,10).map(section=>({title:section.title,answer:section.readout,evidence:section.kpis.slice(0,3).map(([label,value])=>`${label}: ${value}`).join(' | ')}));
 return lensLines(lens).slice(0,10).map(item=>({title:item.title,answer:item.finding,evidence:(item.evidence||[]).join(' | ')}));
}
function lensInsightSentences(lens){
 const strong=lensStrongInsights(lens);
 const workbook=(lens==='tl'||lens==='ops'||lens==='client')?workbookLensBank(lens).map(item=>{const result=workbookLensAnswer(lens,item);return {title:item.question,answer:result.answer,evidence:`${item.category} | ${result.metric||'Lens ranking'}`}}):[];
 const combined=[...strong,...workbook,...lensLines(lens).map(item=>({title:item.title,answer:item.finding,evidence:(item.evidence||[]).join(' | ')}))];
 const seen=new Set(),sentences=[];
 combined.forEach(item=>{
  const text=String(item.answer||'').trim();
  if(!text||seen.has(text))return;
  seen.add(text);
  const clean=text.replace(/\s+/g,' ').replace(/[.;:]+$/,'');
  sentences.push({title:item.title||'Insight',answer:clean,sentence:`${item.title}: ${clean}.`,evidence:item.evidence||''});
 });
 while(sentences.length<10){
  sentences.push({title:`Additional insight ${sentences.length+1}`,answer:'More mapped evidence, period history, or model output is needed to create a stronger quantified finding for this lens',sentence:`Additional insight ${sentences.length+1}: More mapped evidence, period history, or model output is needed to create a stronger quantified finding for this lens.`,evidence:'Data sufficiency guardrail'});
 }
 return sentences.slice(0,10);
}
function parseRankedSummaryItems(answer){
 return String(answer||'').split(/\s*\|\s*/).map(part=>{
  const text=part.replace(/^\s*\d+\.\s*/,'').trim();
  const match=text.match(/^(.+?)\s*\((.+?)\)$/);
  if(!match)return null;
  const metric=match[2].replace(/\s*n\s*=\s*/i,'sample size ').replace(/\s+/g,' ');
  return {name:match[1].trim(),metric};
 }).filter(Boolean);
}
function plainEnglishRankedFinding(title,answer){
 const lower=title.toLowerCase(),items=parseRankedSummaryItems(answer);
 if(!items.length)return '';
 const top=items[0],others=items.slice(1,3).map(item=>item.name).join(' and ');
 const also=others?` ${others} also appear in the next strongest positions.`:'';
 if(/longest target achievement streak/.test(lower))return `${top.name} has the longest target achievement streak (${top.metric}).${also}`;
 if(/longest missed target streak/.test(lower))return `${top.name} has the longest missed-target streak (${top.metric}), so this area needs closer follow-up.${also}`;
 if(/consistently improving/.test(lower))return `${top.name} shows the strongest consistent improvement pattern (${top.metric}).${also}`;
 if(/consistently declining/.test(lower))return `${top.name} shows the clearest declining pattern (${top.metric}), which should be reviewed first.${also}`;
 if(/improved the most/.test(lower))return `${top.name} improved the most (${top.metric}).${also}`;
 if(/declined the most/.test(lower))return `${top.name} declined the most (${top.metric}), making this the first coaching or operating risk to inspect.${also}`;
 if(/highest/.test(lower))return `${top.name} has the highest result (${top.metric}).${also}`;
 if(/lowest/.test(lower))return `${top.name} has the lowest result (${top.metric}) and should be reviewed for root-cause patterns.${also}`;
 if(/most consistent|lowest variation/.test(lower))return `${top.name} is the most consistent (${top.metric}).${also}`;
 if(/least consistent|highest variation|variation/.test(lower))return `${top.name} has the highest variation (${top.metric}), which means performance is less predictable.${also}`;
 if(/survey|volume|responses/.test(lower))return `${top.name} handled the highest survey volume (${top.metric}).${also}`;
 return `${top.name} is the leading result for "${title}" (${top.metric}).${also}`;
}
function lensSummaryLine(item){
 const title=String(item.title||'').replace(/^\s*\d+\.\s*/,'').replace(/\?$/,'');
 const answer=String(item.answer||item.sentence||'').replace(/\s+/g,' ').replace(/[.;]+$/,'');
 if(!answer)return '';
 const ranked=plainEnglishRankedFinding(title,answer);
 if(ranked)return ranked;
 if(/^which |^what |^who |^where |^when |^how /i.test(title)){
  return answer.replace(/^No agents/i,'No agents').replace(/^No teams/i,'No teams');
 }
 return `${title}: ${answer}`;
}
function lensSummarySections(lens,items){
 const label=lensDisplayName(lens),usable=items.map(lensSummaryLine).filter(Boolean);
 if(!usable.length)return [{title:'In Short',lines:[`${label} does not yet have enough mapped evidence to create a quantified summary.`]}];
 const take=patterns=>usable.filter(line=>patterns.some(pattern=>pattern.test(line))).slice(0,5);
 const used=new Set();
 const nextAvailable=count=>usable.filter(line=>!used.has(line)).slice(0,count);
 const section=(title,patterns)=>{let lines=take(patterns).filter(line=>!used.has(line));if(!lines.length)lines=nextAvailable(2);lines.forEach(line=>used.add(line));return lines.length?{title,lines}:null};
 const sections=[
  section('Team Performance Overview',[/target/i,/improv/i,/declin/i,/highest|lowest|score|consistent|variation|spread/i]),
  section('Agent-Level Insights',[/agent/i,/advisor/i,/representative/i]),
  section('Recovery & Resilience',[/recover/i,/resilien/i,/after coaching/i,/coaching movement/i]),
  section('Survey Volume',[/survey/i,/volume/i,/responses|response count|records/i]),
  section('Intervention',[/intervention/i,/risk/i,/coaching/i,/needs/i,/missed/i])
 ].filter(Boolean);
 const remaining=usable.filter(line=>!used.has(line)).slice(0,5);
 sections.push({title:'In Short',lines:remaining.length?remaining:usable.slice(0,3)});
 return sections;
}
function renderLensSummaryHtml(lens,items){
 const sections=lensSummarySections(lens,items);
 return `<section class="lens-summary-readout" id="lensSummaryReadout"><div class="lens-summary-head"><div><p class="eyebrow">SUMMARY</p><h3>${escapeHtml(lensDisplayName(lens))} executive summary</h3></div><div class="lens-summary-actions"><button class="btn ghost" id="downloadLensSummaryPdf" type="button">Download PDF</button><button class="btn ghost" id="downloadLensSummaryTxt" type="button">Download Notepad</button></div></div>${sections.map(section=>`<article><h4>${escapeHtml(section.title)}</h4><ul>${section.lines.map(line=>`<li>${escapeHtml(line)}</li>`).join('')}</ul></article>`).join('')}</section>`;
}
function lensSummaryText(lens,items){
 return `${lensDisplayName(lens)} Executive Summary\nGenerated ${new Date().toLocaleString()}\n\n${lensSummarySections(lens,items).map(section=>`${section.title}\n${section.lines.map(line=>`- ${line}`).join('\n')}`).join('\n\n')}\n`;
}
function downloadTextFile(filename,text){
 const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}
function downloadLensSummaryPdf(lens,items){
 const report=window.open('','_blank');
 if(!report){alert('Please allow pop-ups to download the PDF summary.');return}
 report.document.open();
 report.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(lensDisplayName(lens))} Summary</title><style>body{font-family:Arial,sans-serif;color:#0b2438;margin:28px;line-height:1.45}h1{font-size:24px;margin:0 0 6px}h2{font-size:15px;margin:22px 0 8px;color:#007c83;text-transform:uppercase;letter-spacing:.08em}li{margin:5px 0}.meta{color:#55708a;margin-bottom:18px}.actions{position:sticky;top:0;background:white;padding-bottom:12px;text-align:right}.actions button{border:1px solid #0b8f95;border-radius:999px;background:#0b8f95;color:white;padding:8px 14px;font-weight:700}@media print{.actions{display:none}}</style></head><body><div class="actions"><button onclick="window.print()">Download PDF</button></div><h1>${escapeHtml(lensDisplayName(lens))} Executive Summary</h1><p class="meta">Generated ${escapeHtml(new Date().toLocaleString())}</p>${lensSummarySections(lens,items).map(section=>`<h2>${escapeHtml(section.title)}</h2><ul>${section.lines.map(line=>`<li>${escapeHtml(line)}</li>`).join('')}</ul>`).join('')}</body></html>`);
 report.document.close();
}
function bindLensSummaryActions(lens,items){
 const summarize=$('summarizeLensInsights'),pdf=$('downloadLensSummaryPdf'),txt=$('downloadLensSummaryTxt');
 if(summarize)summarize.onclick=()=>{const wrap=$('lensInsightSummaryWrap');if(wrap)wrap.innerHTML=renderLensSummaryHtml(lens,items);bindLensSummaryActions(lens,items)};
 if(pdf)pdf.onclick=()=>downloadLensSummaryPdf(lens,items);
 if(txt)txt.onclick=()=>downloadTextFile(`${lensDisplayName(lens).replace(/\W+/g,'_').toLowerCase()}_summary.txt`,lensSummaryText(lens,items));
}
function openLensInsightsWindow(lens=state.activeLens||'qa'){
 const label=lensDisplayName(lens),items=lensInsightSentences(lens);
 $('evidenceStatus').textContent=`${label.toUpperCase()} - TOP 10 INSIGHTS`;
 $('evidenceTitle').textContent='Top 10 insights';
 $('evidenceAnswer').textContent=`10 sentence readout generated from the current completed analysis and the ${label}.`;
 $('evidenceMethod').textContent='Built from the calculated answers already shown inside the selected lens cards.';
 $('evidenceDerived').textContent=`${items.length} executive-ready insight sentences are shown below.`;
 $('evidenceLogic').textContent='The popup prioritizes quantified lens findings first, then fills any remaining slots with data-sufficiency guardrails.';
 $('evidenceStatistics').textContent='10 insight sentences';
 $('evidenceGuardrail').textContent='Treat any sentence marked as needing more mapped evidence as a prompt to upload or map the missing fields before using it externally.';
 $('evidenceTable').innerHTML=`<div class="lens-popup-actions"><button class="btn primary" id="summarizeLensInsights" type="button">Summarize</button></div><div id="lensInsightSummaryWrap"></div><ol class="lens-insight-sentences">${items.map((item,index)=>`<li><strong>${index+1}.</strong><span>${escapeHtml(item.sentence)}</span>${item.evidence?`<small>${escapeHtml(item.evidence)}</small>`:''}</li>`).join('')}</ol>`;
 bindLensSummaryActions(lens,items);
 const dialog=$('evidenceDialog');if(!dialog.open)dialog.showModal();
}
function insightsReadout(){const active=state.activeLens||'qa';return `<div class="lens-shell"><div class="lens-toolbar"><div class="lens-tabs">${lensConfig.map(([id,label])=>`<button class="lens-tab ${id===active?'active':''}" data-lens="${id}">${label}</button>`).join('')}</div><button class="lens-insights-button" id="lensInsightsButton" type="button">Insights</button></div><div id="lensContent">${renderLensContent(active)}</div></div>`}
function customRawRows(){const sources=[state.analysis?.feedbackRows,state.analysis?.feedbackTableRows,state.analysis?.preview,state.analysis?.rawRows,state.analysis?.rows].filter(rows=>Array.isArray(rows)&&rows.length);return sources[0]||[]}
function customSourceRows(){const sources=[state.analysis?.feedbackRows,state.analysis?.feedbackTableRows,state.analysis?.preview,state.analysis?.agents,state.analysis?.managers,state.analysis?.periods].filter(rows=>Array.isArray(rows)&&rows.length);return sources[0]||[]}
function customFieldList(rows){const preferred=['Agent Name','Agent','Manager','Manager Name','Team','Channel','Theme','Primary Theme','Owl Theme','ACPT','Owl ACPT','Resolution Status','Owl Resolution Status'];const keys=[...new Set(rows.flatMap(row=>Object.keys(row||{})))];return [...preferred.filter(key=>keys.includes(key)),...keys.filter(key=>!preferred.includes(key))].slice(0,80)}
function customMetricValue(row,metric){if(metric==='responses')return rowResponses(row)||1;if(metric==='score')return num(row.NPS??row.nps??row.Score??row.score??row['NPS / Score']);if(metric==='positive')return num(row.Positive??row.positive??row.PositiveSentiment??row.positiveSentiment);if(metric==='negative')return num(row.Negative??row.negative??row.NegativeSentiment??row.negativeSentiment);return 1}
function buildCustomViewRows(){const rows=customSourceRows(),fields=customFieldList(rows);const cfg=state.customView||{};const field=cfg.field&&fields.includes(cfg.field)?cfg.field:(fields[0]||''),metric=cfg.metric||'score',show=cfg.show||'top',limit=Math.max(5,Math.min(25,Number(cfg.rows)||10));if(!field)return {rows:[],fields,field,metric,show,limit};const groups=new Map();rows.forEach(row=>{const label=String(row?.[field]??'').trim();if(!label)return;const value=customMetricValue(row,metric);const item=groups.get(label)||{label,count:0,total:0,valid:0};item.count+=1;if(Number.isFinite(value)){item.total+=value;item.valid+=1}groups.set(label,item)});let output=[...groups.values()].map(item=>({...item,value:metric==='responses'||metric==='count'?item.count:item.valid?item.total/item.valid:NaN})).filter(item=>Number.isFinite(item.value));output.sort((a,b)=>show==='bottom'?a.value-b.value:b.value-a.value);return {rows:output.slice(0,limit),fields,field,metric,show,limit}}
function customViewsTab(){const view=buildCustomViewRows(),selected=(value,current)=>value===current?'selected':'';return `<section class="custom-views"><div class="custom-view-controls"><label>Field / analyzed output<select id="customField">${view.fields.map(field=>`<option value="${escapeHtml(field)}" ${selected(field,view.field)}>${escapeHtml(field)}</option>`).join('')}</select></label><label>Show<select id="customShow"><option value="top" ${selected('top',view.show)}>Top</option><option value="bottom" ${selected('bottom',view.show)}>Bottom</option></select></label><label>Metric<select id="customMetric"><option value="score" ${selected('score',view.metric)}>NPS / Score</option><option value="responses" ${selected('responses',view.metric)}>Responses</option><option value="positive" ${selected('positive',view.metric)}>Positive sentiment</option><option value="negative" ${selected('negative',view.metric)}>Negative sentiment</option></select></label><label>Rows<select id="customRows">${[5,10,15,20,25].map(n=>`<option value="${n}" ${Number(view.limit)===n?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="custom-view-summary"><strong>${escapeHtml((view.show==='top'?'Top ':'Bottom ')+view.limit+' by '+(view.field||'field'))}</strong><span>${escapeHtml(view.rows.length+' ranked rows')}</span></div><div class="custom-view-list">${view.rows.length?view.rows.map((row,index)=>`<article class="custom-view-card"><span class="custom-rank">${index+1}</span><div class="custom-view-main"><strong>${escapeHtml(row.label)}</strong><span>Responses: ${row.count.toLocaleString()}</span></div><div class="custom-view-score"><b>${view.metric==='responses'?Math.round(row.value).toLocaleString():fmt(row.value)}</b><small>${escapeHtml(view.metric)}</small></div></article>`).join(''):'<div class="custom-empty">No ranked rows are available for this field. Choose another field or metric.</div>'}</div></section>`}
function bindCustomViews(){['customField','customShow','customMetric','customRows'].forEach(id=>{const el=$(id);if(!el)return;el.onchange=()=>{state.customView={field:$('customField')?.value,show:$('customShow')?.value,metric:$('customMetric')?.value,rows:Number($('customRows')?.value)||10};renderResultTab('custom')}})}
function dimensionSourceRows(){return customRawRows().length?customRawRows():customSourceRows()}
function dynamicDimensionPayload(){return Array.isArray(state.analysis?.dynamicDimensions)?state.analysis.dynamicDimensions.filter(item=>item&&String(item.name||'').trim()&&Array.isArray(item.rows)&&item.rows.length):[]}
function dynamicDimensionCandidates(){return dynamicDimensionPayload().map(item=>{const total=(item.rows||[]).reduce((sum,row)=>sum+(rowResponses(row)||0),0);return{field:String(item.name||'').trim(),fill:total?100:0,unique:(item.rows||[]).length,score:200,selected:true,payload:item}}).filter(item=>item.field&&item.unique>0)}
function dimensionCandidates(){const dynamic=dynamicDimensionCandidates();if(dynamic.length)return dynamic;const rows=dimensionSourceRows(),keys=[...new Set(rows.flatMap(row=>Object.keys(row||{})))],bad=/\b(id|case|conversation|comment|feedback|verbatim|text|description|email|phone|mobile|date|time|score|rating|nps|csat|sentiment confidence|probability|confidence)\b/i,preferred=/location|site|region|country|market|city|state|channel|product|queue|lob|language|customer|segment|type|tier|brand|business|department|workgroup|team|manager|supervisor/i,selected=new Set(state.customDimensions||[]);const detected=keys.map(key=>{const vals=rows.map(row=>row?.[key]).filter(v=>v!==undefined&&v!==null&&String(v).trim()!=='').map(v=>String(v).trim());const unique=[...new Set(vals)],fill=rows.length?vals.length/rows.length*100:0,avgLen=vals.length?avg(vals.map(v=>v.length)):0,score=(preferred.test(key)?30:0)+Math.min(fill,50)+(unique.length>1?20:0)-(bad.test(key)?80:0)-(unique.length>Math.max(50,rows.length*.35)?40:0)-(avgLen>60?30:0)+(selected.has(key)?100:0);return{field:key,fill,unique:unique.length,score,selected:selected.has(key)}}).filter(d=>d.score>20&&d.unique>1&&d.fill>=20).sort((a,b)=>b.score-a.score||a.field.localeCompare(b.field)).slice(0,30);return selected.size?detected.filter(item=>selected.has(item.field)):detected}
function dimensionGroupRows(field,minSample){const dynamic=dynamicDimensionPayload().find(item=>String(item.name||'').trim()===field);if(dynamic){return (dynamic.rows||[]).map(row=>{const count=rowResponses(row)||0,avgScore=num(row.NPS??row.Score??row.score??row.Avg_Rating??row['Avg Rating']),positive=num(row.Positive??row.positive),negative=num(row.Negative??row.negative),neutral=num(row.Neutral??row.neutral),positivePct=count&&Number.isFinite(positive)?positive/count*100:num(row['Positive %']??row.PositivePct??row.positivePct),negativePct=count&&Number.isFinite(negative)?negative/count*100:num(row['Negative %']??row.NegativePct??row.negativePct);return{label:String(row[field]??row[dynamic.name]??row.Dimension??row.Group??row.name??'Unknown'),count,avg:avgScore,positive:Number.isFinite(positive)?positive:0,negative:Number.isFinite(negative)?negative:0,neutral:Number.isFinite(neutral)?neutral:0,positivePct,negativePct,reliable:count>=minSample&&Number.isFinite(avgScore),driver:row['Top Driver']||''}}).filter(item=>item.count>0).sort((a,b)=>(b.reliable-a.reliable)||b.count-a.count||String(a.label).localeCompare(String(b.label)))}const rows=dimensionSourceRows(),groups=new Map();rows.forEach(row=>{const label=String(row?.[field]??'').trim();if(!label)return;const item=groups.get(label)||{label,count:0,scores:[],positive:0,negative:0,neutral:0};item.count++;const score=customMetricValue(row,'score');if(Number.isFinite(score))item.scores.push(score);const sentiment=typeof sentimentValue==='function'?sentimentValue(row):'';if(sentiment==='Positive')item.positive++;else if(sentiment==='Negative')item.negative++;else if(sentiment==='Neutral')item.neutral++;groups.set(label,item)});return[...groups.values()].map(item=>({...item,avg:item.scores.length?avg(item.scores):NaN,negativePct:item.count?item.negative/item.count*100:NaN,positivePct:item.count?item.positive/item.count*100:NaN,reliable:item.count>=minSample&&item.scores.length>0})).filter(item=>item.count>0).sort((a,b)=>(b.reliable-a.reliable)||b.count-a.count||String(a.label).localeCompare(String(b.label)))}
function dimensionQuestionRows(field,groups,minSample){const reliable=groups.filter(g=>g.reliable),byScore=[...reliable].sort((a,b)=>b.avg-a.avg),byVolume=[...groups].sort((a,b)=>b.count-a.count),weak=[...reliable].sort((a,b)=>a.avg-b.avg),negative=[...groups].filter(g=>Number.isFinite(g.negativePct)).sort((a,b)=>b.negativePct-a.negativePct),spread=byScore.length>=2?byScore[0].avg-weak[0].avg:NaN,highVolumeLowScore=byVolume.filter(g=>g.reliable&&Number.isFinite(g.avg)).sort((a,b)=>b.count-a.count||a.avg-b.avg).find(g=>g.avg<(avg(reliable.map(x=>x.avg))||0));const q=(question,status,basis,formula,values)=>({question,status,basis,formula,values});return[
 q(`Which ${field} is performing best?`,byScore[0]?'yes':'unknown',byScore[0]?`${byScore[0].label} has the highest average NPS among reliable ${field} groups.`:`No ${field} group has enough score evidence.`,'Rank reliable groups by average NPS descending',byScore.slice(0,5).map(g=>({[field]:g.label,Responses:g.count,'Avg NPS':g.avg}))),
 q(`Which ${field} is weakest?`,weak[0]?'no':'unknown',weak[0]?`${weak[0].label} has the lowest average NPS among reliable ${field} groups.`:`No ${field} group has enough score evidence.`,'Rank reliable groups by average NPS ascending',weak.slice(0,5).map(g=>({[field]:g.label,Responses:g.count,'Avg NPS':g.avg}))),
 q(`Is performance variation high across ${field}?`,Number.isFinite(spread)&&spread<=10?'yes':Number.isFinite(spread)?'no':'unknown',Number.isFinite(spread)?`The spread between best and weakest reliable ${field} groups is ${fmt(spread)} points.`:`At least two reliable ${field} groups are needed.`,'Best reliable group average - weakest reliable group average; high if > 10 pts',[{Metric:'Reliable groups',Value:reliable.length},{Metric:'Spread',Value:spread},{Metric:'Threshold',Value:10}]),
 q(`Which ${field} has the highest volume?`,byVolume[0]?'yes':'unknown',byVolume[0]?`${byVolume[0].label} has the highest response volume.`:`No ${field} values are available.`,'Rank groups by response count descending',byVolume.slice(0,5).map(g=>({[field]:g.label,Responses:g.count,'Avg NPS':g.avg}))),
 q(`Is any high-volume ${field} group below average?`,highVolumeLowScore?'no':'yes',highVolumeLowScore?`${highVolumeLowScore.label} has high volume and below-average NPS.`:`No high-volume reliable ${field} group is below the dimension average.`,'Find reliable high-volume groups with average score below the reliable-group average',highVolumeLowScore?[{[field]:highVolumeLowScore.label,Responses:highVolumeLowScore.count,'Avg NPS':highVolumeLowScore.avg,'Dimension Avg':avg(reliable.map(x=>x.avg))}]:[]),
 q(`Which ${field} has the highest negative sentiment?`,negative[0]?'no':'unknown',negative[0]?`${negative[0].label} has the highest negative sentiment share among rows with sentiment labels.`:`Sentiment is not available for this dimension.`,'Rank groups by negative sentiment share descending',negative.slice(0,5).map(g=>({[field]:g.label,Responses:g.count,'Negative %':g.negativePct,'Negative Count':g.negative})))
]}
function dimensionsTab(){const candidates=dimensionCandidates(),rows=dimensionSourceRows(),selected=(state.dimensionView?.field&&candidates.some(c=>c.field===state.dimensionView.field))?state.dimensionView.field:(candidates[0]?.field||''),minSample=Number(state.dimensionView?.minSample)||Number(state.rules.minimumSample)||10,groups=selected?dimensionGroupRows(selected,minSample):[],reliable=groups.filter(g=>g.reliable),best=[...reliable].sort((a,b)=>b.avg-a.avg)[0],weak=[...reliable].sort((a,b)=>a.avg-b.avg)[0],questions=selected?dimensionQuestionRows(selected,groups,minSample):[];state.dimensionQuestionDetails=questions;const cards=[{label:'Rows scanned',value:rows.length.toLocaleString(),note:'Completed/enriched row output'},{label:'Detected dimensions',value:candidates.length.toLocaleString(),note:'Recommended categorical fields'},{label:'Groups analyzed',value:reliable.length.toLocaleString(),note:`Minimum sample ${minSample}`},{label:'Best group',value:best?.label||'n/a',note:best?`${fmt(best.avg)} NPS, ${best.count} rows`:'Need reliable groups'},{label:'Weakest group',value:weak?.label||'n/a',note:weak?`${fmt(weak.avg)} NPS, ${weak.count} rows`:'Need reliable groups'}];return `<section class="custom-views dimensions-view"><div class="custom-view-controls"><label>Detected dimension<select id="dimensionField">${candidates.map(c=>`<option value="${escapeHtml(c.field)}" ${c.field===selected?'selected':''}>${escapeHtml(c.field)} (${c.unique} groups)</option>`).join('')}</select></label><label>Minimum sample<select id="dimensionMinSample">${[5,10,20,30,50,100].map(n=>`<option value="${n}" ${n===minSample?'selected':''}>${n}</option>`).join('')}</select></label></div>${!candidates.length?'<div class="custom-empty">No usable dimensions were detected. Add categorical fields such as Location, Site, Region, Channel, Product, Queue, or Customer Type in the base or lookup file.</div>':''}<div class="performance-overview-grid owl-performance-grid dimension-card-grid">${cards.map(card=>`<article class="performance-overview-card"><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(String(card.value))}</strong><small>${escapeHtml(card.note)}</small></article>`).join('')}</div><div class="results-table-wrap decision-guide-wrap dimension-question-wrap"><table class="decision-guide-table dimension-question-table"><thead><tr><th>#</th><th>Dimension Question</th><th>Answer</th><th>Status</th><th>Info</th></tr></thead><tbody>${questions.map((q,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(q.question)}</td><td>${escapeHtml(q.basis||decisionGuideLabel(q.status))}</td><td><span class="decision-indicator ${q.status}" aria-label="${decisionGuideLabel(q.status)}">${decisionGuideIcon(q.status)}</span></td><td><button class="decision-info-button" type="button" data-dimension-question="${i}" aria-label="Calculation basis">i</button></td></tr>`).join('')||'<tr><td colspan="5">Select a detected dimension to view dynamic questions.</td></tr>'}</tbody></table></div><div class="table-wrap compact-table owl-table-wrap dimension-group-wrap"><table class="owl-evidence-table dimension-group-table"><thead><tr><th>${escapeHtml(selected||'Dimension')}</th><th>Responses</th><th>Avg NPS</th><th>Positive %</th><th>Negative %</th><th>Reliability</th></tr></thead><tbody>${groups.slice(0,80).map(g=>`<tr><td>${escapeHtml(g.label)}</td><td>${g.count.toLocaleString()}</td><td>${fmt(g.avg)}</td><td>${fmt(g.positivePct)}%</td><td>${fmt(g.negativePct)}%</td><td>${g.reliable?'Reliable':'Low sample'}</td></tr>`).join('')||'<tr><td colspan="6">No grouped rows available for this dimension.</td></tr>'}</tbody></table></div></section>`}
function showDimensionQuestionBasis(index){const detail=state.dimensionQuestionDetails?.[index];if(!detail)return;$('evidenceStatus').textContent='DIMENSION INSIGHT - CALCULATION BASIS';$('evidenceTitle').textContent=detail.question;$('evidenceAnswer').textContent=decisionGuideLabel(detail.status);$('evidenceMethod').textContent=detail.basis;$('evidenceDerived').textContent=detail.status==='yes'?'Tick mark':detail.status==='no'?'X mark':'Unable to derive';$('evidenceLogic').textContent=detail.formula;$('evidenceStatistics').textContent='Generated only for the selected detected dimension and the chosen minimum sample.';$('evidenceGuardrail').textContent='Low-sample groups are shown in the table but excluded from reliable best/weakest decisions.';const rows=Array.isArray(detail.values)?detail.values:[];if(!rows.length){$('evidenceTable').innerHTML='<p class="table-hint">No additional values were available for this dimension question.</p>'}else{const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))].slice(0,8);$('evidenceTable').innerHTML='<h3 class="evidence-data-title">Values used</h3><div class="results-table-wrap"><table class="evidence-table"><thead><tr>'+columns.map(column=>'<th>'+escapeHtml(column)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+columns.map(column=>'<td>'+escapeHtml(typeof row[column]==='number'?Number(row[column]).toFixed(2):row[column]??'')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}$('evidenceDialog').showModal()}
function bindDimensions(){['dimensionField','dimensionMinSample'].forEach(id=>{const el=$(id);if(!el)return;el.onchange=()=>{state.dimensionView={field:$('dimensionField')?.value,minSample:Number($('dimensionMinSample')?.value)||10};renderResultTab('dimensions')}});document.querySelectorAll('[data-dimension-question]').forEach(button=>button.onclick=()=>showDimensionQuestionBasis(Number(button.dataset.dimensionQuestion)))}
function renderLensContent(lens){try{if(lens==='qa')return renderQaLensContent();if(lens==='tl'||lens==='ops'||lens==='client')return renderWorkbookLensContent(lens);if(lens==='vp')return renderVpLensContent();return renderQaLensContent()}catch(error){console.error('Lens render failed',lens,error);return `<section class="lens-readout"><h2>${escapeHtml(lensDisplayName?.(lens)||'Insights Lens')}</h2><p class="table-hint">This lens could not be rendered from the current payload. The tab is available, but one of its mapped data dependencies is missing.</p><div class="custom-empty">${escapeHtml(error?.message||'Lens render failed')}</div></section>`}}
function bindLensTabs(){const renderActiveLens=lens=>{state.activeLens=lens||'qa';document.querySelectorAll('[data-lens]').forEach(button=>button.classList.toggle('active',button.dataset.lens===state.activeLens));const content=$('lensContent');if(content)content.innerHTML=renderLensContent(state.activeLens);if(typeof bindQaLensCards==='function')bindQaLensCards();if(typeof bindWorkbookLensCards==='function')bindWorkbookLensCards();if(typeof bindVpLensMode==='function')bindVpLensMode()};document.querySelectorAll('[data-lens]').forEach(button=>button.onclick=event=>{event.preventDefault();renderActiveLens(button.dataset.lens)});const insight=$('lensInsightsButton');if(insight)insight.onclick=()=>openLensInsightsWindow(state.activeLens||'qa');if($('lensContent'))renderActiveLens(state.activeLens||'qa')}
function performanceMetricCard(label,value,note='',tone='neutral',index=0){
 return `<article class="performance-overview-card ${tone}" data-performance-card="${index}" title="Double-click to view calculation"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${note?`<small>${escapeHtml(note)}</small>`:''}</article>`
}
function metricCalc(title,value,method,formula,rows=[],guardrail='Calculated from the current filtered analysis payload.'){
 return {title,value,method,formula,rows,guardrail,logic:'Double-click evidence for this performance card.',statistics:'Displayed values use two decimal points for score, percentage, movement, average, and volatility metrics.'}
}
function showMetricCalculation(index){const detail=state.performanceCardDetails?.[index];if(!detail)return;$('evidenceStatus').textContent='PERFORMANCE CARD ï¿½ CALCULATION';$('evidenceTitle').textContent=detail.title;$('evidenceAnswer').textContent=detail.value;$('evidenceMethod').textContent=detail.method;$('evidenceDerived').textContent=detail.formula;$('evidenceLogic').textContent=detail.logic;$('evidenceStatistics').textContent=detail.statistics;$('evidenceGuardrail').textContent=detail.guardrail;const rows=Array.isArray(detail.rows)?detail.rows:[];if(!rows.length){$('evidenceTable').innerHTML='<p class="table-hint">No additional row-level values were required for this card.</p>'}else{const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))].slice(0,8);$('evidenceTable').innerHTML=`<h3 class="evidence-data-title">Values used</h3><div class="results-table-wrap"><table class="evidence-table"><thead><tr>${columns.map(column=>`<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${columns.map(column=>`<td>${escapeHtml(typeof row[column]==='number'?Number(row[column]).toFixed(2):row[column]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}$('evidenceDialog').showModal()}
function bindPerformanceCards(){document.querySelectorAll('[data-performance-card]').forEach(card=>card.ondblclick=()=>showMetricCalculation(Number(card.dataset.performanceCard)))}
function analysisPeriods(){const a=state.analysis||{};const sources=[a.weekly,a.periods,a.periodRows,a.trend,a.scoreTrend,a.periodSummary,a.timeSeries];for(const source of sources){if(Array.isArray(source)&&source.length)return source}return[]}
function roundedCountsFromShares(total,shares){const raw=shares.map(share=>Math.max(0,Number(share||0))*total/100),counts=raw.map(Math.floor);let remaining=Math.max(0,Math.round(total)-counts.reduce((sum,value)=>sum+value,0));raw.map((value,index)=>({index,remainder:value-Math.floor(value)})).sort((a,b)=>b.remainder-a.remainder).forEach(item=>{if(remaining>0){counts[item.index]++;remaining--}});return counts}
function npsBucketCountsFromSummary(summary={},counts={},total=0){
 const exact=[num(counts.Promoter??counts.Promoters??counts.promoter??counts.promoters??counts.Promoter_Count??counts.promoterCount),num(counts.Passive??counts.Passives??counts.passive??counts.passives??counts.Passive_Count??counts.passiveCount),num(counts.Detractor??counts.Detractors??counts.detractor??counts.detractors??counts.Detractor_Count??counts.detractorCount)];
 const exactTotal=exact.reduce((sum,value)=>sum+(Number.isFinite(value)?value:0),0);
 if(Number.isFinite(total)&&total>0&&exact.every(Number.isFinite)&&Math.abs(exactTotal-total)<=1){return {promoters:exact[0],passives:exact[1],detractors:exact[2],promoterPct:exact[0]/total*100}}
 const supplied=[num(summary.Promoters??summary.promoters??summary.Promoter??summary.promoter??summary.promoterCount),num(summary.Passives??summary.passives??summary.Passive??summary.passive??summary.passiveCount),num(summary.Detractors??summary.detractors??summary.Detractor??summary.detractor??summary.detractorCount)];
 const suppliedTotal=supplied.reduce((sum,value)=>sum+(Number.isFinite(value)?value:0),0);
 const percentShaped=Number.isFinite(total)&&total>100&&supplied.every(Number.isFinite)&&suppliedTotal>0&&Math.abs(suppliedTotal-100)<=1.5;
 const values=percentShaped?roundedCountsFromShares(total,supplied):supplied;
 return {promoters:values[0],passives:values[1],detractors:values[2],promoterPct:percentShaped?supplied[0]:(Number.isFinite(values[0])&&Number.isFinite(total)&&total?values[0]/total*100:NaN)};
}
function rowPeriodName(row){return String(row?.Week??row?.week??row?.Period??row?.period??row?.Date??row?.date??row?.name??row?.label??'')}
function rowResponses(row){return num(row?.Responses??row?.responses??row?.n??row?.N??row?.count??row?.Count??row?.total??row?.Total)}

function performanceOverviewTab(){
 const a=state.analysis||{},summary=a.summary||{},sentiment=a.sentiment||{};
 const total=num(summary.total??summary.Total??summary.Responses??summary.responses??a.population?.rows??state.base?.rows);
 const score=num(summary.NPS??summary.nps??summary.overallNPS??summary.score??a.overall?.nps);
 const bucketCounts=npsBucketCountsFromSummary(summary,a.counts||{},total),first=num(bucketCounts.promoters),second=num(bucketCounts.passives),third=num(bucketCounts.detractors),pct=num(bucketCounts.promoterPct);
 const scoreRows=analysisPeriods().map(r=>({period:rowPeriodName(r),score:num(r.NPS??r.nps??r.mean??r.Mean??r.score??r.Score),responses:rowResponses(r)})).filter(r=>Number.isFinite(r.score));
 const latest=scoreRows.at(-1),prev=scoreRows.at(-2),movement=latest&&prev?latest.score-prev.score:NaN,best=scoreRows.length?[...scoreRows].sort((a,b)=>b.score-a.score)[0]:null,low=scoreRows.length?[...scoreRows].sort((a,b)=>a.score-b.score)[0]:null,avg4=scoreRows.length?avg(scoreRows.slice(-4).map(r=>r.score)):NaN,volatility=scoreRows.length?std(scoreRows.map(r=>r.score)):NaN,latestVol=latest&&prev&&Number.isFinite(latest.responses)&&Number.isFinite(prev.responses)?latest.responses-prev.responses:NaN;
 const positiveSent=num(sentiment.Positive??sentiment.positive??summary.PositiveSentiment??summary.positiveSentiment),negativeSent=num(sentiment.Negative??sentiment.negative??summary.NegativeSentiment??summary.negativeSentiment);
 const cards=[
  ['Total responses',Number.isFinite(total)?Math.round(total).toLocaleString():'n/a','All records included in this run.','good'],
  ['Promoters',Number.isFinite(first)?Math.round(first).toLocaleString():'n/a','Records in this outcome band.','good'],
  ['Passives',Number.isFinite(second)?Math.round(second).toLocaleString():'n/a','Records in the middle band.','neutral'],
  ['Detractors',Number.isFinite(third)?Math.round(third).toLocaleString():'n/a','Records in the negative band.','risk'],
  ['% promoters',Number.isFinite(pct)?fmt(pct)+'%':'n/a','Positive outcome share.','good'],
  ['NPS',Number.isFinite(score)?fmt(score):'n/a','All records used in this NPS calculation.','good'],
  ['WoW NPS',Number.isFinite(movement)?signed(movement)+' pts':'n/a',latest&&prev?'Latest '+fmt(latest.score)+' vs prior '+fmt(prev.score)+'.':'Need two periods.',Number.isFinite(movement)&&movement<0?'risk':'good'],
  ['WoW volume',Number.isFinite(latestVol)?signed(latestVol):'n/a',latest&&prev?'Latest '+Math.round(latest.responses||0)+' vs prior '+Math.round(prev.responses||0)+'.':'Need two periods.','neutral'],
  ['4-week avg NPS',Number.isFinite(avg4)?fmt(avg4):'n/a','Rolling view across latest available weeks.','good'],
  ['Best week',best?fmt(best.score):'n/a',best?.period||'', 'good'],
  ['Lowest week',low?fmt(low.score):'n/a',low?.period||'', 'risk'],
  ['NPS volatility',Number.isFinite(volatility)?fmt(volatility):'n/a','Lower is more consistent week to week.','neutral'],
  ['Positive sentiment',Number.isFinite(positiveSent)?fmt(positiveSent)+'%':'n/a','Sparrow positive share.','good'],
  ['Negative sentiment',Number.isFinite(negativeSent)?fmt(negativeSent)+'%':'n/a','Sparrow negative share.','risk']
 ];
 state.performanceCardDetails=cards.map(([label,value,note],index)=>metricCalc(label,value,note||'Calculated metric.','See values used below.',[{Metric:label,Value:value,Note:note}], 'Calculated from the completed analysis payload.'));
 return '<section class="performance-overview"><div class="performance-overview-grid">'+cards.map(([l,v,n,t],index)=>performanceMetricCard(l,v,n,t,index)).join('')+'</div></section>'
}

function analyzedOutputRows(){const sources=[state.analysis?.feedbackRows,state.analysis?.feedbackTableRows,state.analysis?.preview].filter(rows=>Array.isArray(rows)&&rows.length);if(!sources.length)return[];const outputNames=['Primary Reason','Owl Primary Driver','Primary Theme','Theme','Predicted Theme','Owl Theme','ACPT Primary Category','ACPT','Predicted ACPT','Owl ACPT','Owl Resolution Status','Resolution Status'];const scored=sources.map((rows,index)=>({rows,index,score:rows.reduce((sum,row)=>sum+(outputNames.some(name=>row?.[name]!==undefined&&row?.[name]!==null&&String(row?.[name]).trim())?1:0),0)}));scored.sort((a,b)=>b.score-a.score||a.index-b.index);return scored[0].rows}
function analyzedOutputValue(row,names){if(!row)return'';for(const name of names){if(row[name]!==undefined&&row[name]!==null&&String(row[name]).trim())return String(row[name]).trim()}const lookup=Object.fromEntries(Object.keys(row).map(key=>[key.toLowerCase(),key]));for(const name of names){const key=lookup[String(name).toLowerCase()];if(key&&row[key]!==undefined&&row[key]!==null&&String(row[key]).trim())return String(row[key]).trim()}return''}
function analyzedOutputDistribution(rows,names){const counts=new Map();rows.forEach(row=>{const value=analyzedOutputValue(row,names);if(!value)return;counts.set(value,(counts.get(value)||0)+1)});return [...counts.entries()].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label))}
function analyzedOutputTableRows(rows,mode){const themeNames=['Primary Reason','Owl Primary Driver','Primary Theme','Theme','Predicted Theme','Owl Theme','Driver','Reason'];const acptNames=['ACPT Primary Category','ACPT','Predicted ACPT','Owl ACPT','Ownership','Accountability','Bucket Category','Owl Customer Impact'];const resolutionNames=['Owl Resolution Status','Resolution Status','Predicted Resolution','Resolution'];const confidenceNames=['ACPT Confidence','Theme Confidence','Confidence','confidence','Probability','probability'];const feedbackNames=['Verbatim Feedback','Customer Comments','Feedback','Comments','Comment','Customer Feedback','Text','Owl Analysis Source'];return rows.map(row=>({Theme:analyzedOutputValue(row,themeNames)||'Not classified',ACPT:analyzedOutputValue(row,acptNames)||'Not classified','Resolution Status':analyzedOutputValue(row,resolutionNames)||'Not mentioned',Confidence:analyzedOutputValue(row,confidenceNames)||'',Feedback:analyzedOutputValue(row,feedbackNames)||''})).filter(row=>mode==='theme'?row.Theme&&row.Theme!=='Not classified':row.ACPT&&row.ACPT!=='Not classified').slice(0,60)}
function owlTopCards(prefix,dist,total,limit=8){return dist.slice(0,limit).map((item,index)=>({label:prefix+' '+(index+1),value:item.label,note:item.count.toLocaleString()+' rows'+(total?' ('+fmt(item.count/total*100)+'%)':''),tone:index===0?'':'neutral'}))}
function owlPerformanceCards(cards){return '<div class="performance-overview-grid owl-performance-grid">'+cards.map((card,index)=>'<article class="performance-overview-card '+(card.tone||'')+'"><span>'+escapeHtml(card.label)+'</span><strong>'+escapeHtml(String(card.value))+'</strong>'+(card.note?'<small>'+escapeHtml(card.note)+'</small>':'')+'</article>').join('')+'</div>'}
function themesOverviewTab(){const rows=analyzedOutputRows(),checkedTotal=Math.min(rows.length,Math.round(num(state.analysis?.summary?.total??state.base?.rows)||rows.length));const names=['Primary Reason','Owl Primary Driver','Primary Theme','Theme','Predicted Theme','Owl Theme','Driver','Reason'],themes=analyzedOutputDistribution(rows,names),classified=themes.reduce((s,i)=>s+i.count,0),table=analyzedOutputTableRows(rows,'theme');const cards=[{label:'Rows checked',value:checkedTotal.toLocaleString(),note:'Analyzed row output'},{label:'Rows with theme',value:classified.toLocaleString(),note:'Rows with theme output'},{label:'Theme coverage',value:checkedTotal?fmt(classified/checkedTotal*100)+'%':'0.00%',note:'Share with theme output'},{label:'Top theme',value:themes[0]?.label||'No theme output',note:themes[0]?themes[0].count.toLocaleString()+' rows':'Run Owl to populate'}].concat(owlTopCards('Theme',themes,checkedTotal,8));return '<section class="performance-overview owl-performance-review owl-no-intro">'+owlPerformanceCards(cards)+'<div class="table-wrap compact-table owl-table-wrap"><table class="owl-evidence-table"><thead><tr><th>Theme</th><th>ACPT</th><th>Resolution Status</th><th>Confidence</th><th>Feedback</th></tr></thead><tbody>'+(table.length?table.map(row=>'<tr><td>'+escapeHtml(row.Theme)+'</td><td>'+escapeHtml(row.ACPT)+'</td><td>'+escapeHtml(row['Resolution Status'])+'</td><td>'+escapeHtml(row.Confidence)+'</td><td>'+escapeHtml(row.Feedback)+'</td></tr>').join(''):'<tr><td colspan="5">No theme classified rows are available yet.</td></tr>')+'</tbody></table></div></section>'}
function acptOverviewTab(){const rows=analyzedOutputRows(),checkedTotal=Math.min(rows.length,Math.round(num(state.analysis?.summary?.total??state.base?.rows)||rows.length));const names=['ACPT Primary Category','ACPT','Predicted ACPT','Owl ACPT','Ownership','Accountability','Bucket Category','Owl Customer Impact'],acpt=analyzedOutputDistribution(rows,names),classified=acpt.reduce((s,i)=>s+i.count,0),table=analyzedOutputTableRows(rows,'acpt');const cards=[{label:'Rows checked',value:checkedTotal.toLocaleString(),note:'Analyzed row output'},{label:'Rows with ACPT',value:classified.toLocaleString(),note:'Rows with ownership output'},{label:'ACPT coverage',value:checkedTotal?fmt(classified/checkedTotal*100)+'%':'0.00%',note:'Share with ACPT output'},{label:'Top ownership',value:acpt[0]?.label||'No ACPT output',note:acpt[0]?acpt[0].count.toLocaleString()+' rows':'Run Owl to populate'}].concat(owlTopCards('ACPT',acpt,checkedTotal,8));return '<section class="performance-overview owl-performance-review owl-no-intro">'+owlPerformanceCards(cards)+'<div class="table-wrap compact-table owl-table-wrap"><table class="owl-evidence-table"><thead><tr><th>ACPT</th><th>Theme</th><th>Resolution Status</th><th>Confidence</th><th>Feedback</th></tr></thead><tbody>'+(table.length?table.map(row=>'<tr><td>'+escapeHtml(row.ACPT)+'</td><td>'+escapeHtml(row.Theme)+'</td><td>'+escapeHtml(row['Resolution Status'])+'</td><td>'+escapeHtml(row.Confidence)+'</td><td>'+escapeHtml(row.Feedback)+'</td></tr>').join(''):'<tr><td colspan="5">No ACPT classified rows are available yet.</td></tr>')+'</tbody></table></div></section>'}

function decisionGuideStatus(ok,unknown=false){return unknown?'unknown':ok?'yes':'no'}
function decisionGuideIcon(status){return status==='yes'?'&#10003;':status==='no'?'&#10005;':'!'}
function decisionGuideLabel(status){return status==='yes'?'Yes':status==='no'?'No':'Unable to derive'}
function buildTargetDecisionRows(metric,scoreRows,score,target,total,minSample){
 const responseOk=function(r,fallback){const responses=Number.isFinite(r?.responses)?r.responses:fallback;return !Number.isFinite(responses)||responses>=minSample};
 const current=scoreRows.at(-1)||{period:'Current period',score,responses:total},previous=scoreRows.at(-2),validWeeks=scoreRows.filter(function(r){return Number.isFinite(r.score)&&Number.isFinite(target)&&responseOk(r,total)});
 const currentReady=Number.isFinite(current?.score)&&Number.isFinite(target)&&responseOk(current,total),previousReady=Number.isFinite(previous?.score)&&Number.isFinite(target)&&responseOk(previous,total);
 const gap=currentReady?current.score-target:NaN,previousGap=previousReady?previous.score-target:NaN;
 const slice=function(n){return validWeeks.slice(-n)},avgScore=function(rows){return rows.length?avg(rows.map(function(r){return r.score})):NaN},metCount=function(rows){return rows.filter(function(r){return r.score>=target}).length},missCount=function(rows){return rows.filter(function(r){return r.score<target}).length};
 const values=function(rows){return rows.map(function(r){const o={Period:r.period,Target:target,Responses:r.responses,Met:r.score>=target?'Yes':'No',Gap:r.score-target};o[metric]=r.score;return o})};
 const rule=function(q,ok,unknown,positive,negative,unsure,consideration,formula,vals){return{cat:'Target',q,ok,unknown,basis:'Tick / Positive Logic: '+positive+' | X / Negative Logic: '+negative+' | Unsure / N.A. Logic: '+unsure+' | Consideration: '+consideration,formula,values:vals}};
 const rows4=slice(4),rows8=slice(8),rows12=slice(12),rows2=slice(2),avg4=avgScore(rows4),avg8=avgScore(rows8),avg12=avgScore(rows12),rate=validWeeks.length?metCount(validWeeks)/validWeeks.length*100:NaN,latestMiss=currentReady&&current.score<target,previousMiss=previousReady&&previous.score<target;
 return [
  rule('Are we meeting the current period target?',currentReady&&current.score>=target,!currentReady,'Current Score >= Current Target','Current Score < Current Target','Current Score missing OR Current Target missing OR response count below threshold','Basic target achievement check','Current '+metric+' >= Target',[{Metric:'Current '+metric,Value:current?.score},{Metric:'Target',Value:target},{Metric:'Responses',Value:current?.responses??total},{Metric:'Minimum sample',Value:minSample}]),
  rule('Is the current target gap positive?',Number.isFinite(gap)&&gap>0,!Number.isFinite(gap),'Current Gap > 0','Current Gap <= 0','Current Score missing OR Current Target missing OR response count below threshold','Gap = Score - Target','Current '+metric+' - Target > 0',[{Metric:'Current gap',Value:gap},{Metric:'Current '+metric,Value:current?.score},{Metric:'Target',Value:target}]),
  rule('Are we at least at target or better?',Number.isFinite(gap)&&gap>=0,!Number.isFinite(gap),'Current Gap >= 0','Current Gap < 0','Current Score missing OR Current Target missing OR response count below threshold','Includes exactly at target','Current '+metric+' - Target >= 0',[{Metric:'Current gap',Value:gap},{Metric:'Current '+metric,Value:current?.score},{Metric:'Target',Value:target}]),
  rule('Are we within acceptable target tolerance?',Number.isFinite(gap)&&gap>=-2,!Number.isFinite(gap),'Current Gap >= -2','Current Gap < -2','Current Score missing OR Current Target missing OR response count below threshold','Small miss is treated as acceptable','Current gap >= -2',[{Metric:'Current gap',Value:gap},{Metric:'Tolerance',Value:-2}]),
  rule('Are we avoiding a material target miss?',Number.isFinite(gap)&&gap>-5,!Number.isFinite(gap),'Current Gap > -5','Current Gap <= -5','Current Score missing OR Current Target missing OR response count below threshold','Material miss threshold = 5 points','Current gap > -5',[{Metric:'Current gap',Value:gap},{Metric:'Material miss threshold',Value:-5}]),
  rule('Are we avoiding a critical target miss?',Number.isFinite(gap)&&gap>-10,!Number.isFinite(gap),'Current Gap > -10','Current Gap <= -10','Current Score missing OR Current Target missing OR response count below threshold','Critical miss threshold = 10 points','Current gap > -10',[{Metric:'Current gap',Value:gap},{Metric:'Critical miss threshold',Value:-10}]),
  rule('Is the current gap better than the previous period gap?',Number.isFinite(gap)&&Number.isFinite(previousGap)&&gap>previousGap,!Number.isFinite(gap)||!Number.isFinite(previousGap),'Current Gap > Previous Gap','Current Gap <= Previous Gap','Current Score / Target missing OR Previous Score / Target missing OR current / previous response count below threshold','Compares gap movement, not just score movement','Current gap > Previous gap',[{Metric:'Current gap',Value:gap},{Metric:'Previous gap',Value:previousGap}]),
  rule('Is the current score better than the previous period score?',currentReady&&previousReady&&current.score>previous.score,!currentReady||!previousReady,'Current Score > Previous Score','Current Score <= Previous Score','Current Score missing OR Previous Score missing OR current / previous response count below threshold','Pure score movement','Current '+metric+' > Previous '+metric,[{Period:'Current',Value:current?.score},{Period:'Previous',Value:previous?.score}]),
  rule('Are we improving while staying at or above target?',currentReady&&previousReady&&current.score>=target&&current.score>previous.score,!currentReady||!previousReady,'Current Score >= Current Target AND Current Score > Previous Score','Current Score < Current Target OR Current Score <= Previous Score','Current Score / Target missing OR Previous Score missing OR response count below threshold','Strong positive condition','Current '+metric+' >= Target AND Current '+metric+' > Previous '+metric,[{Metric:'Current '+metric,Value:current?.score},{Metric:'Previous '+metric,Value:previous?.score},{Metric:'Target',Value:target}]),
  rule('Are we avoiding decline while above target?',currentReady&&previousReady&&current.score>=target&&current.score>=previous.score,!currentReady||!previousReady||current.score<target,'Current Score >= Current Target AND Current Score >= Previous Score','Current Score >= Current Target AND Current Score < Previous Score','Current Score < Current Target OR Previous Score missing OR response count below threshold','Applies only when current score is at or above target','Current '+metric+' >= Target AND Current '+metric+' >= Previous '+metric,[{Metric:'Current '+metric,Value:current?.score},{Metric:'Previous '+metric,Value:previous?.score},{Metric:'Target',Value:target}]),
  rule('Are we avoiding below-target decline?',currentReady&&previousReady&&(current.score>=target||current.score>=previous.score),!currentReady||!previousReady,'Current Score >= Current Target OR Current Score >= Previous Score','Current Score < Current Target AND Current Score < Previous Score','Current Score / Target missing OR Previous Score missing OR response count below threshold','X means below target and worsening','Current '+metric+' >= Target OR Current '+metric+' >= Previous '+metric,[{Metric:'Current '+metric,Value:current?.score},{Metric:'Previous '+metric,Value:previous?.score},{Metric:'Target',Value:target}]),
  rule('Are we better than the recent 4-week average?',currentReady&&rows4.length>=4&&current.score>=avg4,!currentReady||rows4.length<4,'Current Score >= Average Score of Last 4 Valid Weeks','Current Score < Average Score of Last 4 Valid Weeks','Fewer than 4 valid weeks OR Current Score missing OR response count below threshold','Valid week = score available and volume acceptable','Current '+metric+' >= Average of last 4 valid weeks',[{Metric:'Current '+metric,Value:current?.score},{Metric:'4-week average',Value:avg4},{Metric:'Valid weeks',Value:rows4.length}]),
  rule('Is the current gap better than the 4-week average gap?',Number.isFinite(gap)&&rows4.length>=4&&gap>=avg4-target,!Number.isFinite(gap)||rows4.length<4,'Current Gap >= Average Gap of Last 4 Valid Weeks','Current Gap < Average Gap of Last 4 Valid Weeks','Fewer than 4 valid weeks OR Current Score / Target missing OR response count below threshold','Average Gap = average of weekly gaps','Current gap >= Average 4-week gap',[{Metric:'Current gap',Value:gap},{Metric:'Average 4-week gap',Value:Number.isFinite(avg4)?avg4-target:NaN},{Metric:'Valid weeks',Value:rows4.length}]),
  rule('Is the 4-week average meeting target?',rows4.length>=4&&avg4>=target,rows4.length<4,'Average Score of Last 4 Valid Weeks >= Average Target of Last 4 Valid Weeks','Average Score of Last 4 Valid Weeks < Average Target of Last 4 Valid Weeks','Fewer than 4 valid weeks','Short-term target health','Average last 4 valid weeks >= Target',[{Metric:'4-week average',Value:avg4},{Metric:'Target',Value:target},{Metric:'Valid weeks',Value:rows4.length}]),
  rule('Is the 8-week average meeting target?',rows8.length>=8&&avg8>=target,rows8.length<8,'Average Score of Last 8 Valid Weeks >= Average Target of Last 8 Valid Weeks','Average Score of Last 8 Valid Weeks < Average Target of Last 8 Valid Weeks','Fewer than 8 valid weeks','Mid-term target health','Average last 8 valid weeks >= Target',[{Metric:'8-week average',Value:avg8},{Metric:'Target',Value:target},{Metric:'Valid weeks',Value:rows8.length}]),
  rule('Is the 12-week average meeting target?',rows12.length>=12&&avg12>=target,rows12.length<12,'Average Score of Last 12 Valid Weeks >= Average Target of Last 12 Valid Weeks','Average Score of Last 12 Valid Weeks < Average Target of Last 12 Valid Weeks','Fewer than 12 valid weeks','Quarterly / executive view','Average last 12 valid weeks >= Target',[{Metric:'12-week average',Value:avg12},{Metric:'Target',Value:target},{Metric:'Valid weeks',Value:rows12.length}]),
  rule('Have at least 3 of the last 4 weeks met target?',rows4.length>=4&&metCount(rows4)>=3,rows4.length<4,'Count of Target Met Weeks in Last 4 >= 3','Count of Target Met Weeks in Last 4 < 3','Fewer than 4 valid weeks','Good recent target consistency','Target met count in last 4 >= 3',values(rows4)),
  rule('Have at least 6 of the last 8 weeks met target?',rows8.length>=8&&metCount(rows8)>=6,rows8.length<8,'Count of Target Met Weeks in Last 8 >= 6','Count of Target Met Weeks in Last 8 < 6','Fewer than 8 valid weeks','75% target achievement over 8 weeks','Target met count in last 8 >= 6',values(rows8)),
  rule('Have at least 9 of the last 12 weeks met target?',rows12.length>=12&&metCount(rows12)>=9,rows12.length<12,'Count of Target Met Weeks in Last 12 >= 9','Count of Target Met Weeks in Last 12 < 9','Fewer than 12 valid weeks','75% target achievement over 12 weeks','Target met count in last 12 >= 9',values(rows12)),
  rule('Have the last 2 weeks both met target?',rows2.length>=2&&metCount(rows2)===2,rows2.length<2,'Latest Week Met Target = Yes AND Previous Week Met Target = Yes','Latest Week Met Target = No OR Previous Week Met Target = No','Fewer than 2 valid weeks','Short-term target hold','Latest 2 valid weeks both >= Target',values(rows2)),
  rule('Have all of the last 4 weeks met target?',rows4.length>=4&&metCount(rows4)===4,rows4.length<4,'Count of Target Met Weeks in Last 4 = 4','Count of Target Met Weeks in Last 4 < 4','Fewer than 4 valid weeks','Perfect recent target performance','Target met count in last 4 = 4',values(rows4)),
  rule('Are we avoiding repeated target misses?',rows4.length>=4&&missCount(rows4)<=1,rows4.length<4,'Count of Missed Weeks in Last 4 <= 1','Count of Missed Weeks in Last 4 >= 2','Fewer than 4 valid weeks','Repeated miss threshold = 2 or more misses','Missed target count in last 4 <= 1',values(rows4)),
  rule('Are we avoiding consecutive target misses?',previousReady&&currentReady&&!(latestMiss&&previousMiss),!previousReady||!currentReady,'Latest and previous valid weeks are not both missed','Latest Week Missed = Yes AND Previous Week Missed = Yes','Fewer than 2 valid weeks','Back-to-back miss detection','NOT(latest missed AND previous missed)',values(rows2)),
  rule('Did we recover to target after the latest miss opportunity?',previousReady&&previousMiss&&current.score>=target,!previousReady||!currentReady||!previousMiss,'Previous Week Missed = Yes AND Current Week Met Target = Yes','Previous Week Missed = Yes AND Current Week Missed = Yes','Previous Week did not miss OR fewer than 2 valid weeks','N.A. if there was no previous miss','Previous missed AND current met target',values(rows2)),
  rule('Are we maintaining target achievement rate above 75%?',Number.isFinite(rate)&&rate>=75,!Number.isFinite(rate),'Target Achievement Rate >= 75%','Target Achievement Rate < 75%','No valid weeks available OR valid week count below selected lookback requirement','Target Achievement Rate = Met Weeks / Valid Weeks','Met valid weeks / valid weeks >= 75%',[{Metric:'Valid weeks',Value:validWeeks.length},{Metric:'Weeks met target',Value:metCount(validWeeks)},{Metric:'Target achievement rate %',Value:rate}])
 ]
}
function buildMomentumDecisionRows(metric,scoreRows,target,total,minSample){
 const responseOk=function(r,fallback){const responses=Number.isFinite(r?.responses)?r.responses:fallback;return !Number.isFinite(responses)||responses>=minSample};
 const valid=scoreRows.filter(function(r){return Number.isFinite(r.score)&&responseOk(r,total)}),current=valid.at(-1),previous=valid.at(-2),period2=valid.at(-3),period3=valid.at(-4);
 const currentReady=!!current,previousReady=!!previous,withTarget=valid.filter(function(r){return Number.isFinite(r.score)&&Number.isFinite(target)});
 const slice=function(n){return valid.slice(-n)},avgScore=function(rows){return rows.length?avg(rows.map(function(r){return r.score})):NaN},gap=function(r){return r&&Number.isFinite(target)?r.score-target:NaN};
 const slope=function(rows){const pairs=(rows||[]).map(function(r,i){return [i,r.score]}).filter(function(p){return Number.isFinite(p[1])});if(pairs.length<2)return NaN;const ax=avg(pairs.map(function(p){return p[0]})),ay=avg(pairs.map(function(p){return p[1]}));const den=pairs.reduce(function(s,p){return s+Math.pow(p[0]-ax,2)},0);return den?pairs.reduce(function(s,p){return s+(p[0]-ax)*(p[1]-ay)},0)/den:NaN};
 const values=function(rows){return (rows||[]).filter(Boolean).map(function(r){const o={Period:r.period,Responses:r.responses,Gap:gap(r)};o[metric]=r.score;return o})};
 const rule=function(q,ok,unknown,positive,negative,unsure,consideration,formula,vals){return{cat:'Momentum',q,ok,unknown,basis:'Tick / Positive Logic: '+positive+' | X / Negative Logic: '+negative+' | Unsure / N.A. Logic: '+unsure+' | Consideration: '+consideration,formula,values:vals}};
 const rows4=slice(4),rows8=slice(8),rows12=slice(12),last8=slice(8),last16=slice(16),avg4=avgScore(rows4),avg8=avgScore(rows8),avg12=avgScore(rows12),prev4=valid.slice(-8,-4),prev8=valid.slice(-16,-8),prev4Avg=avgScore(prev4),prev8Avg=avgScore(prev8),slope4=slope(rows4),slope8=slope(rows8),slope12=slope(rows12);
 const movement=currentReady&&previousReady?current.score-previous.score:NaN,priorMovement=previous&&period2?previous.score-period2.score:NaN,last5=valid.slice(-5),changes4=last5.length>=5?last5.slice(1).map(function(r,i){return r.score-last5[i].score}):[],positiveChanges=changes4.filter(function(v){return v>0}).length,meaningfulDrops=changes4.filter(function(v){return v<=-2}).length;
 const low4=rows4.length?Math.min(...rows4.map(function(r){return r.score})):NaN,avgGap4=Number.isFinite(avg4)&&Number.isFinite(target)?avg4-target:NaN,prevAvgGap4=Number.isFinite(prev4Avg)&&Number.isFinite(target)?prev4Avg-target:NaN,targetMovement=0;
 return [
  rule('Is the current score better than the previous comparable period?',currentReady&&previousReady&&current.score>previous.score,!currentReady||!previousReady,'Current Score > Previous Score','Current Score <= Previous Score','Current Score missing OR Previous Score missing OR response count below threshold','Basic period-over-period improvement','Current '+metric+' > Previous '+metric,values([previous,current])),
  rule('Is the current score at least stable versus the previous period?',currentReady&&previousReady&&current.score>=previous.score,!currentReady||!previousReady,'Current Score >= Previous Score','Current Score < Previous Score','Current Score missing OR Previous Score missing OR response count below threshold','Stable or improved performance','Current '+metric+' >= Previous '+metric,values([previous,current])),
  rule('Has the score improved meaningfully versus the previous period?',Number.isFinite(movement)&&movement>=2,!Number.isFinite(movement),'Current Score - Previous Score >= +2','Current Score - Previous Score < +2','Current Score missing OR Previous Score missing OR response count below threshold','Meaningful improvement threshold = 2 points','Current movement >= 2',[{Metric:'Movement',Value:movement},{Metric:'Threshold',Value:2}]),
  rule('Are we avoiding a meaningful decline?',Number.isFinite(movement)&&movement>-2,!Number.isFinite(movement),'Current Score - Previous Score > -2','Current Score - Previous Score <= -2','Current Score missing OR Previous Score missing OR response count below threshold','Detects whether decline is material','Current movement > -2',[{Metric:'Movement',Value:movement},{Metric:'Meaningful decline threshold',Value:-2}]),
  rule('Are we avoiding a sharp decline?',Number.isFinite(movement)&&movement>-5,!Number.isFinite(movement),'Current Score - Previous Score > -5','Current Score - Previous Score <= -5','Current Score missing OR Previous Score missing OR response count below threshold','Sharp decline threshold = 5 points','Current movement > -5',[{Metric:'Movement',Value:movement},{Metric:'Sharp decline threshold',Value:-5}]),
  rule('Is current performance better than the recent 4-period average?',currentReady&&rows4.length>=4&&current.score>=avg4,!currentReady||rows4.length<4,'Current Score >= Average Score of Last 4 Valid Periods','Current Score < Average Score of Last 4 Valid Periods','Fewer than 4 valid periods OR Current Score missing','Shows whether latest performance is better than recent baseline','Current '+metric+' >= average last 4 valid periods',[{Metric:'Current '+metric,Value:current?.score},{Metric:'4-period average',Value:avg4},{Metric:'Valid periods',Value:rows4.length}]),
  rule('Is current performance better than the recent 8-period average?',currentReady&&rows8.length>=8&&current.score>=avg8,!currentReady||rows8.length<8,'Current Score >= Average Score of Last 8 Valid Periods','Current Score < Average Score of Last 8 Valid Periods','Fewer than 8 valid periods OR Current Score missing','Medium-term comparison','Current '+metric+' >= average last 8 valid periods',[{Metric:'Current '+metric,Value:current?.score},{Metric:'8-period average',Value:avg8},{Metric:'Valid periods',Value:rows8.length}]),
  rule('Is current performance better than the recent 12-period average?',currentReady&&rows12.length>=12&&current.score>=avg12,!currentReady||rows12.length<12,'Current Score >= Average Score of Last 12 Valid Periods','Current Score < Average Score of Last 12 Valid Periods','Fewer than 12 valid periods OR Current Score missing','Executive / quarterly comparison','Current '+metric+' >= average last 12 valid periods',[{Metric:'Current '+metric,Value:current?.score},{Metric:'12-period average',Value:avg12},{Metric:'Valid periods',Value:rows12.length}]),
  rule('Is the latest 4-period average better than the previous 4-period average?',rows4.length>=4&&prev4.length>=4&&avg4>prev4Avg,rows4.length<4||prev4.length<4,'Latest 4-Period Average Score > Previous 4-Period Average Score','Latest 4-Period Average Score <= Previous 4-Period Average Score','Fewer than 8 valid periods','Compares recent 4 periods against the 4 periods before that','Latest 4-period average > previous 4-period average',[{Metric:'Latest 4-period average',Value:avg4},{Metric:'Previous 4-period average',Value:prev4Avg}]),
  rule('Is the latest 8-period average better than the previous 8-period average?',rows8.length>=8&&prev8.length>=8&&avg8>prev8Avg,rows8.length<8||prev8.length<8,'Latest 8-Period Average Score > Previous 8-Period Average Score','Latest 8-Period Average Score <= Previous 8-Period Average Score','Fewer than 16 valid periods','Stronger trend comparison','Latest 8-period average > previous 8-period average',[{Metric:'Latest 8-period average',Value:avg8},{Metric:'Previous 8-period average',Value:prev8Avg}]),
  rule('Is short-term momentum better than mid-term momentum?',rows4.length>=4&&rows8.length>=8&&avg4>avg8,rows8.length<8,'Latest 4-Period Average Score > Latest 8-Period Average Score','Latest 4-Period Average Score <= Latest 8-Period Average Score','Fewer than 8 valid periods','Shows whether recent performance is accelerating','Latest 4-period average > latest 8-period average',[{Metric:'Latest 4-period average',Value:avg4},{Metric:'Latest 8-period average',Value:avg8}]),
  rule('Is short-term momentum better than long-term momentum?',rows4.length>=4&&rows12.length>=12&&avg4>avg12,rows12.length<12,'Latest 4-Period Average Score > Latest 12-Period Average Score','Latest 4-Period Average Score <= Latest 12-Period Average Score','Fewer than 12 valid periods','Useful for leadership view','Latest 4-period average > latest 12-period average',[{Metric:'Latest 4-period average',Value:avg4},{Metric:'Latest 12-period average',Value:avg12}]),
  rule('Is the 4-period trend direction positive?',Number.isFinite(slope4)&&slope4>0,!Number.isFinite(slope4)||rows4.length<4,'Trend Slope over Last 4 Valid Periods > 0','Trend Slope over Last 4 Valid Periods <= 0','Fewer than 4 valid periods','Uses trendline slope','Trend slope last 4 > 0',[{Metric:'4-period slope',Value:slope4},{Metric:'Valid periods',Value:rows4.length}]),
  rule('Is the 8-period trend direction positive?',Number.isFinite(slope8)&&slope8>0,!Number.isFinite(slope8)||rows8.length<8,'Trend Slope over Last 8 Valid Periods > 0','Trend Slope over Last 8 Valid Periods <= 0','Fewer than 8 valid periods','Better than single-period movement','Trend slope last 8 > 0',[{Metric:'8-period slope',Value:slope8},{Metric:'Valid periods',Value:rows8.length}]),
  rule('Is the 12-period trend direction positive?',Number.isFinite(slope12)&&slope12>0,!Number.isFinite(slope12)||rows12.length<12,'Trend Slope over Last 12 Valid Periods > 0','Trend Slope over Last 12 Valid Periods <= 0','Fewer than 12 valid periods','Long-term performance direction','Trend slope last 12 > 0',[{Metric:'12-period slope',Value:slope12},{Metric:'Valid periods',Value:rows12.length}]),
  rule('Are we avoiding consecutive period declines?',current&&previous&&period2&&!(current.score<previous.score&&previous.score<period2.score),valid.length<3,'NOT(Current Score < Previous Score AND Previous Score < Period Before Previous Score)','Current Score < Previous Score AND Previous Score < Period Before Previous Score','Fewer than 3 valid periods','Detects two back-to-back declines','No two consecutive declines across latest 3 valid periods',values([period2,previous,current])),
  rule('Are we avoiding a 3-period downward pattern?',current&&previous&&period2&&period3&&!(current.score<previous.score&&previous.score<period2.score&&period2.score<period3.score),valid.length<4,'NOT(Current Score < Previous Score AND Previous Score < Period Before Previous Score AND Period Before Previous Score < Score 3 Periods Ago)','Current Score < Previous Score AND Previous Score < Period Before Previous Score AND Period Before Previous Score < Score 3 Periods Ago','Fewer than 4 valid periods','Detects sustained decline','No 3-period downward pattern across latest 4 valid periods',values([period3,period2,previous,current])),
  rule('Have most recent movements been positive?',changes4.length>=4&&positiveChanges>=3,changes4.length<4,'Count of Positive Period Changes in Last 4 Changes >= 3','Count of Positive Period Changes in Last 4 Changes < 3','Fewer than 5 valid periods','Positive change = current period score > previous period score','Positive changes in last 4 changes >= 3',[{Metric:'Last 4 changes available',Value:changes4.length},{Metric:'Positive changes',Value:positiveChanges},{Metric:'Changes',Value:changes4.join(', ')}]),
  rule('Are meaningful declines limited in recent periods?',changes4.length>=4&&meaningfulDrops<=1,changes4.length<4,'Count of Period Changes <= -2 in Last 4 Changes <= 1','Count of Period Changes <= -2 in Last 4 Changes >= 2','Fewer than 5 valid periods','Detects repeated meaningful drops','Meaningful drops in last 4 changes <= 1',[{Metric:'Last 4 changes available',Value:changes4.length},{Metric:'Meaningful drops',Value:meaningfulDrops},{Metric:'Drop threshold',Value:-2}]),
  rule('Are we improving compared with the recent low point?',currentReady&&rows4.length>=4&&current.score>low4,!currentReady||rows4.length<4,'Current Score > Minimum Score of Last 4 Valid Periods','Current Score <= Minimum Score of Last 4 Valid Periods','Fewer than 4 valid periods OR Current Score missing','Shows recovery from recent bottom','Current '+metric+' > minimum of last 4 valid periods',[{Metric:'Current '+metric,Value:current?.score},{Metric:'Recent low point',Value:low4},{Metric:'Valid periods',Value:rows4.length}]),
  rule('Is the current target gap improving versus the previous period?',Number.isFinite(gap(current))&&Number.isFinite(gap(previous))&&gap(current)>gap(previous),!current||!previous||!Number.isFinite(target),'Current Gap > Previous Gap','Current Gap <= Previous Gap','Current Score / Target missing OR Previous Score / Target missing OR response count below threshold','Gap movement is often better than score movement','Current gap > previous gap',[{Metric:'Current gap',Value:gap(current)},{Metric:'Previous gap',Value:gap(previous)}]),
  rule('Is the latest 4-period average gap improving versus the previous 4 periods?',Number.isFinite(avgGap4)&&Number.isFinite(prevAvgGap4)&&rows4.length>=4&&prev4.length>=4&&avgGap4>prevAvgGap4,rows4.length<4||prev4.length<4||!Number.isFinite(target),'Latest 4-Period Average Gap > Previous 4-Period Average Gap','Latest 4-Period Average Gap <= Previous 4-Period Average Gap','Fewer than 8 valid periods with targets','Shows whether distance from target is improving','Latest average gap > previous average gap',[{Metric:'Latest 4-period average gap',Value:avgGap4},{Metric:'Previous 4-period average gap',Value:prevAvgGap4}]),
  rule('Is score improvement outpacing target movement?',Number.isFinite(movement)&&movement>targetMovement,!Number.isFinite(movement)||!Number.isFinite(target),'Current Score - Previous Score > Current Target - Previous Target','Current Score - Previous Score <= Current Target - Previous Target','Current / Previous Score missing OR Current / Previous Target missing','Useful when targets change over time','Score movement > target movement',[{Metric:'Score movement',Value:movement},{Metric:'Target movement',Value:targetMovement},{Metric:'Current target',Value:target},{Metric:'Previous target',Value:target}]),
  rule('Is recent momentum positive on adequate volume?',currentReady&&previousReady&&current.score>previous.score&&responseOk(current,total),!currentReady||!previousReady,'Current Score > Previous Score AND Current Response Count >= Threshold','Current Score <= Previous Score OR Current Response Count < Threshold','Current Score missing OR Previous Score missing','Combines direction and reliability','Current '+metric+' > previous '+metric+' AND current responses >= threshold',[{Metric:'Current '+metric,Value:current?.score},{Metric:'Previous '+metric,Value:previous?.score},{Metric:'Current responses',Value:current?.responses??total},{Metric:'Threshold',Value:minSample}]),
  rule('Is the trend-based next-period outlook stable or positive?',Number.isFinite(slope4)&&slope4>=-0.5,!Number.isFinite(slope4)||rows4.length<4,'Trend Slope over Last 4 Valid Periods >= -0.5','Trend Slope over Last 4 Valid Periods < -0.5','Fewer than 4 valid periods','-0.5 allows very small natural movement; configurable','Trend slope last 4 >= -0.5',[{Metric:'4-period slope',Value:slope4},{Metric:'Stable outlook threshold',Value:-0.5},{Metric:'Valid periods',Value:rows4.length}])
 ]
}
function decisionGuideRows(){
 const corr=function(xs,ys){const pairs=xs.map(function(x,i){return [Number(x),Number(ys[i])]}).filter(function(p){return Number.isFinite(p[0])&&Number.isFinite(p[1])});if(pairs.length<3)return NaN;const ax=avg(pairs.map(function(p){return p[0]})),ay=avg(pairs.map(function(p){return p[1]}));const nume=pairs.reduce(function(s,p){return s+(p[0]-ax)*(p[1]-ay)},0),dx=Math.sqrt(pairs.reduce(function(s,p){return s+Math.pow(p[0]-ax,2)},0)),dy=Math.sqrt(pairs.reduce(function(s,p){return s+Math.pow(p[1]-ay,2)},0));return dx&&dy?nume/(dx*dy):NaN};
 const hasValue=function(v){return v!==undefined&&v!==null&&String(v).trim()!==''};
 const contains=function(value,words){const text=String(value||'').toLowerCase();return words.some(function(word){return text.includes(word)})};
 const a=state.analysis||{},summary=a.summary||{},sentiment=a.sentiment||{},total=num(summary.total??summary.Total??summary.Responses??summary.responses??a.population?.rows??state.base?.rows),target=num(state.rules.target),score=num(summary.NPS??summary.nps??summary.overallNPS??summary.score??a.overall?.nps);
 const buckets=npsBucketCountsFromSummary(summary,a.counts||{},total),good=num(buckets.promoters),bad=num(buckets.detractors),share=num(buckets.promoterPct);
 const scoreRows=analysisPeriods().map(function(r){return {period:rowPeriodName(r),score:num(r.NPS??r.nps??r.mean??r.Mean??r.score??r.Score),responses:rowResponses(r),negative:num(r.Negative??r.negative??r.NegativeSentiment??r.negativeSentiment)}}).filter(function(r){return Number.isFinite(r.score)});
 const latest=scoreRows.at(-1),prev=scoreRows.at(-2),movement=latest&&prev?latest.score-prev.score:NaN,avg4=scoreRows.length?avg(scoreRows.slice(-4).map(function(r){return r.score})):NaN,volatility=scoreRows.length?std(scoreRows.map(function(r){return r.score})):NaN,minSample=Number(state.rules.minimumSample)||10;
 const positiveSent=num(sentiment.Positive??sentiment.positive??summary.PositiveSentiment??summary.positiveSentiment),negativeSent=num(sentiment.Negative??sentiment.negative??summary.NegativeSentiment??summary.negativeSentiment),sentTotal=num(sentiment.Total??sentiment.total??sentiment.Classified??sentiment.classified);
 const analyzedRows=typeof analyzedOutputRows==='function'?analyzedOutputRows():[],themeNames=['Primary Reason','Owl Primary Driver','Primary Theme','Theme','Predicted Theme','Owl Theme','Driver','Reason'],acptNames=['ACPT Primary Category','ACPT','Predicted ACPT','Owl ACPT','Ownership','Accountability','Bucket Category','Owl Customer Impact'],resolutionNames=['Owl Resolution Status','Resolution Status','Predicted Resolution','Resolution'];
 const themeDist=typeof analyzedOutputDistribution==='function'?analyzedOutputDistribution(analyzedRows,themeNames):[],acptDist=typeof analyzedOutputDistribution==='function'?analyzedOutputDistribution(analyzedRows,acptNames):[],resolutionDist=typeof analyzedOutputDistribution==='function'?analyzedOutputDistribution(analyzedRows,resolutionNames):[];
 const themeCount=themeDist.reduce(function(s,i){return s+i.count},0),acptCount=acptDist.reduce(function(s,i){return s+i.count},0),resolutionCount=resolutionDist.reduce(function(s,i){return s+i.count},0),topThemeShare=themeCount&&themeDist[0]?themeDist[0].count/themeCount*100:NaN;
 const processTechCount=acptDist.filter(function(i){return /process|technology|technical|system|policy|product/i.test(i.label)}).reduce(function(s,i){return s+i.count},0),agentCount=acptDist.filter(function(i){return /agent|advisor|representative|people|soft/i.test(i.label)}).reduce(function(s,i){return s+i.count},0);
 const unresolvedCount=resolutionDist.filter(function(i){return /unresolved|not resolved|open|pending|review|required|failed/i.test(i.label)}).reduce(function(s,i){return s+i.count},0);
 const ranked=[...(a.agents||[]),...(a.managers||[])].map(function(r){return rowResponses(r)}).filter(Number.isFinite),reliableRanked=ranked.filter(function(v){return v>=minSample}).length;
 const agentScores=(a.agents||[]).map(function(r){return num(r['Agent NPS']??r.NPS??r.nps??r.score??r.Score)}).filter(Number.isFinite),managerScores=(a.managers||[]).map(function(r){return num(r['Manager NPS']??r.NPS??r.nps??r.score??r.Score)}).filter(Number.isFinite);
 const agentSpread=agentScores.length?Math.max(...agentScores)-Math.min(...agentScores):NaN,managerSpread=managerScores.length?Math.max(...managerScores)-Math.min(...managerScores):NaN,volumeCorr=corr(scoreRows.map(function(r){return r.responses}),scoreRows.map(function(r){return r.score})),negativeCorr=corr(scoreRows.map(function(r){return r.negative}),scoreRows.map(function(r){return r.score}));
 const meanScore=avg(scoreRows.map(function(r){return r.score})),outliers=Number.isFinite(volatility)&&volatility>0?scoreRows.filter(function(r){return Math.abs(r.score-meanScore)>2*volatility}).length:0,latestMeaningful=Number.isFinite(movement)&&Number.isFinite(volatility)?Math.abs(movement)>=Math.max(1,volatility/2):false;
 const latest4Rows=scoreRows.slice(-4),targetWeeks=scoreRows.filter(function(r){return Number.isFinite(target)&&r.score>=target}).length,targetRate=scoreRows.length?targetWeeks/scoreRows.length*100:NaN,latest4TargetWeeks=latest4Rows.filter(function(r){return Number.isFinite(target)&&r.score>=target}).length;
 const positiveShare=Number.isFinite(share)?share:(Number.isFinite(good)&&Number.isFinite(total)&&total?good/total*100:NaN),negativeShare=Number.isFinite(bad)&&Number.isFinite(total)&&total?bad/total*100:NaN;
 const latestVolumeChange=latest&&prev&&Number.isFinite(latest.responses)&&Number.isFinite(prev.responses)?latest.responses-prev.responses:NaN,latestVolumeChangePct=latest&&prev&&Number.isFinite(latest.responses)&&Number.isFinite(prev.responses)&&prev.responses?latestVolumeChange/prev.responses*100:NaN;
 const processTechShare=acptCount?processTechCount/acptCount*100:NaN,unresolvedShare=resolutionCount?unresolvedCount/resolutionCount*100:NaN;
 const gap=Number.isFinite(score)&&Number.isFinite(target)?score-target:NaN,firstRow=scoreRows[0],prev2=scoreRows.at(-3),last8Rows=scoreRows.slice(-8),previous4Rows=scoreRows.slice(-8,-4),targetMixThreshold=50;
 const bestAll=scoreRows.length?[...scoreRows].sort(function(a,b){return b.score-a.score})[0]:null,lowAll=scoreRows.length?[...scoreRows].sort(function(a,b){return a.score-b.score})[0]:null,bestRecent=last8Rows.length?[...last8Rows].sort(function(a,b){return b.score-a.score})[0]:null;
 const targetRateFor=function(rows){const valid=(rows||[]).filter(function(r){return Number.isFinite(r.score)&&Number.isFinite(target)});return valid.length?valid.filter(function(r){return r.score>=target}).length/valid.length*100:NaN};
 const avgScoreFor=function(rows){const vals=(rows||[]).map(function(r){return r.score}).filter(Number.isFinite);return vals.length?avg(vals):NaN};
 const firstHalfRows=scoreRows.slice(0,Math.floor(scoreRows.length/2)),secondHalfRows=scoreRows.slice(Math.floor(scoreRows.length/2)),firstHalfTargetRate=targetRateFor(firstHalfRows),secondHalfTargetRate=targetRateFor(secondHalfRows),latest4Avg=avgScoreFor(latest4Rows),previous4Avg=avgScoreFor(previous4Rows);
 const missedLatest4=latest4Rows.filter(function(r){return Number.isFinite(target)&&r.score<target}).length,missedPrevious4=previous4Rows.filter(function(r){return Number.isFinite(target)&&r.score<target}).length;
 const bestIndex=bestAll?scoreRows.indexOf(bestAll):-1,lowIndex=lowAll?scoreRows.indexOf(lowAll):-1,priorMovement=prev&&prev2?prev.score-prev2.score:NaN,acceleration=Number.isFinite(movement)&&Number.isFinite(priorMovement)?movement-priorMovement:NaN;
 const slope=function(rows){const pairs=(rows||[]).map(function(r,i){return [i,r.score]}).filter(function(p){return Number.isFinite(p[1])});if(pairs.length<3)return NaN;const ax=avg(pairs.map(function(p){return p[0]})),ay=avg(pairs.map(function(p){return p[1]}));const den=pairs.reduce(function(s,p){return s+Math.pow(p[0]-ax,2)},0);return den?pairs.reduce(function(s,p){return s+(p[0]-ax)*(p[1]-ay)},0)/den:NaN}(scoreRows);
 const targetExtraRows=[
  {cat:'Target',q:'Are we at least 5 points above the NPS target?',ok:Number.isFinite(gap)&&gap>=5,unknown:!Number.isFinite(gap),basis:'Checks whether current performance has meaningful headroom above target.',formula:'Current NPS - Target >= 5',values:[{Metric:'Current NPS',Value:score},{Metric:'Target',Value:target},{Metric:'Gap',Value:gap},{Metric:'Required gap',Value:5}]},
  {cat:'Target',q:'If below target, is the miss within 2 points?',ok:Number.isFinite(gap)&&gap>=-2,unknown:!Number.isFinite(gap),basis:'Checks whether the current miss is small enough to be treated as near-target.',formula:'Current NPS - Target >= -2',values:[{Metric:'Target gap',Value:gap},{Metric:'Near-target tolerance',Value:-2}]},
  {cat:'Target',q:'Have at least 3 of the last 4 weeks met target?',ok:latest4Rows.length>=4&&latest4TargetWeeks>=3,unknown:latest4Rows.length<4||!Number.isFinite(target),basis:'Checks whether recent target performance is strong even if one week missed.',formula:'Latest 4 weeks meeting target >= 3',values:[{Metric:'Latest 4 weeks',Value:latest4Rows.length},{Metric:'Weeks meeting target',Value:latest4TargetWeeks},{Metric:'Required weeks',Value:3}]},
  {cat:'Target',q:'Have the last 2 weeks both met target?',ok:scoreRows.slice(-2).length>=2&&scoreRows.slice(-2).every(function(r){return r.score>=target}),unknown:scoreRows.length<2||!Number.isFinite(target),basis:'Checks whether the most recent target performance is sustained across two weeks.',formula:'Latest 2 weeks >= target',values:scoreRows.slice(-2).map(function(r){return {Period:r.period,'NPS':r.score,Target:target,Met:r.score>=target?'Yes':'No'}})},
  {cat:'Target',q:'Did the latest week recover to target after a prior miss?',ok:latest&&prev&&latest.score>=target&&prev.score<target,unknown:!latest||!prev||!Number.isFinite(target),basis:'Flags a positive recovery pattern from prior-week miss to current target achievement.',formula:'Latest NPS >= target AND previous NPS < target',values:latest&&prev?[{Period:'Latest','NPS':latest.score,Target:target},{Period:'Previous','NPS':prev.score,Target:target}]:[]},
  {cat:'Target',q:'Is the 4-week average meeting target?',ok:Number.isFinite(latest4Avg)&&Number.isFinite(target)&&latest4Avg>=target,unknown:!Number.isFinite(latest4Avg)||!Number.isFinite(target),basis:'Checks whether recent average performance is at or above target.',formula:'Latest 4-week average NPS >= target',values:[{Metric:'Latest 4-week average',Value:latest4Avg},{Metric:'Target',Value:target},{Metric:'Gap',Value:Number.isFinite(latest4Avg)&&Number.isFinite(target)?latest4Avg-target:NaN}]},
  {cat:'Target',q:'Is the worst of the last 4 weeks within 3 points of target?',ok:latest4Rows.length>=4&&Math.min(...latest4Rows.map(function(r){return r.score}))>=target-3,unknown:latest4Rows.length<4||!Number.isFinite(target),basis:'Checks whether recent misses are still close to target.',formula:'Minimum latest-4 NPS >= target - 3',values:latest4Rows.map(function(r){return {Period:r.period,'NPS':r.score,Target:target,Gap:r.score-target}})},
  {cat:'Target',q:'Are all latest 4 weeks within 5 points of target?',ok:latest4Rows.length>=4&&latest4Rows.every(function(r){return r.score>=target-5}),unknown:latest4Rows.length<4||!Number.isFinite(target),basis:'Checks whether recent performance avoids severe target misses.',formula:'Each latest-4 NPS >= target - 5',values:latest4Rows.map(function(r){return {Period:r.period,'NPS':r.score,Target:target,Gap:r.score-target}})},
  {cat:'Target',q:'Is the target lead larger than normal volatility?',ok:Number.isFinite(gap)&&Number.isFinite(volatility)&&gap>=volatility,unknown:!Number.isFinite(gap)||!Number.isFinite(volatility),basis:'Checks whether performance is above target by more than normal period variation.',formula:'Target gap >= period standard deviation',values:[{Metric:'Target gap',Value:gap},{Metric:'Standard deviation',Value:volatility}]},
  {cat:'Target',q:'Is target achievement improving versus the first half?',ok:Number.isFinite(secondHalfTargetRate)&&Number.isFinite(firstHalfTargetRate)&&secondHalfTargetRate>firstHalfTargetRate,unknown:!Number.isFinite(secondHalfTargetRate)||!Number.isFinite(firstHalfTargetRate),basis:'Compares target hit rate in the second half of the selected period against the first half.',formula:'Second-half target hit rate > first-half target hit rate',values:[{Metric:'First-half target hit rate %',Value:firstHalfTargetRate},{Metric:'Second-half target hit rate %',Value:secondHalfTargetRate}]},
  {cat:'Target',q:'Is the latest week closer to target than the previous week?',ok:latest&&prev&&Number.isFinite(target)&&Math.abs(latest.score-target)<Math.abs(prev.score-target),unknown:!latest||!prev||!Number.isFinite(target),basis:'Checks whether the latest period moved closer to the target even if target was not met.',formula:'Abs(latest gap) < abs(previous gap)',values:latest&&prev?[{Period:'Latest',Gap:latest.score-target},{Period:'Previous',Gap:prev.score-target}]:[]},
  {cat:'Target',q:'Has the best week exceeded target by at least 5 points?',ok:bestAll&&Number.isFinite(target)&&bestAll.score-target>=5,unknown:!bestAll||!Number.isFinite(target),basis:'Checks whether the account has demonstrated a strong achievable peak above target.',formula:'Best week NPS - target >= 5',values:bestAll?[{Period:bestAll.period,'Best week NPS':bestAll.score,Target:target,Gap:bestAll.score-target}]:[]},
  {cat:'Target',q:'Has even the lowest week stayed above target?',ok:lowAll&&Number.isFinite(target)&&lowAll.score>=target,unknown:!lowAll||!Number.isFinite(target),basis:'Checks whether the entire selected period stayed above target.',formula:'Lowest week NPS >= target',values:lowAll?[{Period:lowAll.period,'Lowest week NPS':lowAll.score,Target:target,Gap:lowAll.score-target}]:[]},
  {cat:'Target',q:'Are missed-target weeks reducing recently?',ok:latest4Rows.length>=4&&previous4Rows.length>=4&&missedLatest4<missedPrevious4,unknown:latest4Rows.length<4||previous4Rows.length<4||!Number.isFinite(target),basis:'Compares missed-target count in latest 4 weeks against the previous 4 weeks.',formula:'Missed target count in latest 4 < missed target count in previous 4',values:[{Metric:'Latest 4 missed weeks',Value:missedLatest4},{Metric:'Previous 4 missed weeks',Value:missedPrevious4}]},
  {cat:'Target',q:'Does the positive outcome mix support the target?',ok:Number.isFinite(positiveShare)&&positiveShare>=targetMixThreshold,unknown:!Number.isFinite(positiveShare),basis:'Checks whether the positive outcome share is strong enough for the expected target posture.',formula:'Positive outcome share >= operating threshold',values:[{Metric:'Positive outcome share %',Value:positiveShare},{Metric:'Threshold %',Value:targetMixThreshold}]}
 ];
 const momentumExtraRows=[
  {cat:'Momentum',q:'Has NPS improved over the last 2 weeks?',ok:latest&&prev2&&latest.score>prev2.score,unknown:!latest||!prev2,basis:'Compares the latest period with two weeks ago.',formula:'Latest NPS > NPS two periods ago',values:latest&&prev2?[{Period:'Latest','NPS':latest.score},{Period:'Two periods ago','NPS':prev2.score},{Metric:'Change',Value:latest.score-prev2.score}]:[]},
  {cat:'Momentum',q:'Has NPS improved over the last 3 weeks?',ok:latest&&scoreRows.at(-4)&&latest.score>scoreRows.at(-4).score,unknown:!latest||!scoreRows.at(-4),basis:'Compares the latest period with three periods ago.',formula:'Latest NPS > NPS three periods ago',values:latest&&scoreRows.at(-4)?[{Period:'Latest','NPS':latest.score},{Period:'Three periods ago','NPS':scoreRows.at(-4).score},{Metric:'Change',Value:latest.score-scoreRows.at(-4).score}]:[]},
  {cat:'Momentum',q:'Are the last 3 weeks non-declining?',ok:scoreRows.slice(-3).length>=3&&scoreRows.slice(-3).every(function(r,i,arr){return i===0||r.score>=arr[i-1].score}),unknown:scoreRows.length<3,basis:'Checks whether each of the last three periods held or improved.',formula:'Week 2 >= Week 1 AND Week 3 >= Week 2',values:scoreRows.slice(-3).map(function(r){return {Period:r.period,'NPS':r.score}})},
  {cat:'Momentum',q:'Is improvement happening without a volume shock?',ok:Number.isFinite(movement)&&movement>0&&Number.isFinite(latestVolumeChangePct)&&Math.abs(latestVolumeChangePct)<=20,unknown:!Number.isFinite(movement)||!Number.isFinite(latestVolumeChangePct),basis:'Checks whether the latest improvement occurred while response volume stayed within normal range.',formula:'Movement > 0 AND abs(volume change %) <= 20',values:[{Metric:'Movement',Value:movement},{Metric:'Volume change %',Value:latestVolumeChangePct},{Metric:'Volume shock threshold %',Value:20}]},
  {cat:'Momentum',q:'Is the latest 4-week average above the previous 4-week average?',ok:Number.isFinite(latest4Avg)&&Number.isFinite(previous4Avg)&&latest4Avg>previous4Avg,unknown:!Number.isFinite(latest4Avg)||!Number.isFinite(previous4Avg),basis:'Compares rolling recent performance against the prior four-period block.',formula:'Latest 4-week average > previous 4-week average',values:[{Metric:'Latest 4-week average',Value:latest4Avg},{Metric:'Previous 4-week average',Value:previous4Avg},{Metric:'Change',Value:Number.isFinite(latest4Avg)&&Number.isFinite(previous4Avg)?latest4Avg-previous4Avg:NaN}]},
  {cat:'Momentum',q:'Is latest NPS above the first available period?',ok:latest&&firstRow&&latest.score>firstRow.score,unknown:!latest||!firstRow,basis:'Checks whether performance improved across the selected range.',formula:'Latest NPS > first available NPS',values:latest&&firstRow?[{Period:'First',Label:firstRow.period,'NPS':firstRow.score},{Period:'Latest',Label:latest.period,'NPS':latest.score},{Metric:'Change',Value:latest.score-firstRow.score}]:[]},
  {cat:'Momentum',q:'Is the overall trend slope positive?',ok:Number.isFinite(slope)&&slope>0,unknown:!Number.isFinite(slope),basis:'Uses a simple linear trend slope across all available periods.',formula:'Linear trend slope > 0',values:[{Metric:'Slope per period',Value:slope},{Metric:'Periods used',Value:scoreRows.length}]},
  {cat:'Momentum',q:'Is the best week part of the latest 4 weeks?',ok:bestIndex>=Math.max(0,scoreRows.length-4),unknown:bestIndex<0||scoreRows.length<4,basis:'Checks whether the peak performance is recent.',formula:'Best-week index is inside latest 4 periods',values:bestAll?[{Metric:'Best week index',Value:bestIndex+1},{Metric:'Total periods',Value:scoreRows.length},{Period:bestAll.period,'NPS':bestAll.score}]:[]},
  {cat:'Momentum',q:'Is the lowest week behind us?',ok:lowIndex>=0&&lowIndex<Math.max(0,scoreRows.length-4),unknown:lowIndex<0||scoreRows.length<4,basis:'Checks whether the weakest period occurred before the latest four weeks.',formula:'Lowest-week index is before latest 4 periods',values:lowAll?[{Metric:'Lowest week index',Value:lowIndex+1},{Metric:'Total periods',Value:scoreRows.length},{Period:lowAll.period,'NPS':lowAll.score}]:[]},
  {cat:'Momentum',q:'Has recent average improved by at least 2 points?',ok:Number.isFinite(latest4Avg)&&Number.isFinite(previous4Avg)&&latest4Avg-previous4Avg>=2,unknown:!Number.isFinite(latest4Avg)||!Number.isFinite(previous4Avg),basis:'Checks whether rolling improvement is large enough to matter operationally.',formula:'Latest 4-week average - previous 4-week average >= 2',values:[{Metric:'Latest 4-week average',Value:latest4Avg},{Metric:'Previous 4-week average',Value:previous4Avg},{Metric:'Change',Value:Number.isFinite(latest4Avg)&&Number.isFinite(previous4Avg)?latest4Avg-previous4Avg:NaN}]},
  {cat:'Momentum',q:'Is week-over-week movement better than the prior movement?',ok:Number.isFinite(movement)&&Number.isFinite(priorMovement)&&movement>priorMovement,unknown:!Number.isFinite(movement)||!Number.isFinite(priorMovement),basis:'Checks whether movement is accelerating versus the previous week-over-week change.',formula:'Latest movement > prior movement',values:[{Metric:'Latest movement',Value:movement},{Metric:'Prior movement',Value:priorMovement},{Metric:'Acceleration',Value:acceleration}]},
  {cat:'Momentum',q:'Have we recovered from the lowest week?',ok:latest&&lowAll&&latest.score>lowAll.score,unknown:!latest||!lowAll,basis:'Checks whether the latest score is higher than the lowest observed period.',formula:'Latest NPS > lowest-week NPS',values:latest&&lowAll?[{Period:'Lowest',Label:lowAll.period,'NPS':lowAll.score},{Period:'Latest',Label:latest.period,'NPS':latest.score},{Metric:'Recovery',Value:latest.score-lowAll.score}]:[]},
  {cat:'Momentum',q:'Is improvement happening without higher negative sentiment?',ok:Number.isFinite(movement)&&movement>0&&latest&&prev&&(!Number.isFinite(latest.negative)||!Number.isFinite(prev.negative)||latest.negative<=prev.negative),unknown:!Number.isFinite(movement)||!latest||!prev,basis:'Checks whether score improvement is not accompanied by a rise in negative sentiment.',formula:'Movement > 0 AND latest negative sentiment <= previous negative sentiment',values:latest&&prev?[{Period:'Latest','NPS':latest.score,Negative:latest.negative},{Period:'Previous','NPS':prev.score,Negative:prev.negative},{Metric:'Movement',Value:movement}]:[]},
  {cat:'Momentum',q:'Is acceleration positive?',ok:Number.isFinite(acceleration)&&acceleration>0,unknown:!Number.isFinite(acceleration),basis:'Checks whether the latest week-over-week change is stronger than the prior change.',formula:'Latest movement - prior movement > 0',values:[{Metric:'Latest movement',Value:movement},{Metric:'Prior movement',Value:priorMovement},{Metric:'Acceleration',Value:acceleration}]},
  {cat:'Momentum',q:'Is latest NPS within 2 points of the recent best?',ok:latest&&bestRecent&&bestRecent.score-latest.score<=2,unknown:!latest||!bestRecent,basis:'Checks whether current performance is close to the best recent level.',formula:'Best recent NPS - latest NPS <= 2',values:latest&&bestRecent?[{Period:'Recent best',Label:bestRecent.period,'NPS':bestRecent.score},{Period:'Latest',Label:latest.period,'NPS':latest.score},{Metric:'Gap to recent best',Value:bestRecent.score-latest.score}]:[]}
 ];
 const rows=[
  ...buildTargetDecisionRows('NPS',scoreRows,score,target,total,minSample),
  ...buildMomentumDecisionRows('NPS',scoreRows,target,total,minSample),
  {cat:'Risk',q:'Is the Detractors share under control?',ok:Number.isFinite(negativeShare)&&negativeShare<=25,unknown:!Number.isFinite(negativeShare),basis:'Checks whether the negative outcome band is below a practical risk threshold.',formula:'Detractors share <= 25%',values:[{Metric:'Detractors',Value:bad},{Metric:'Total responses',Value:total},{Metric:'Detractors share %',Value:negativeShare},{Metric:'Threshold %',Value:25}]},
  {cat:'Risk',q:'Is positive sentiment stronger than negative sentiment?',ok:positiveSent>=negativeSent,unknown:!Number.isFinite(positiveSent)||!Number.isFinite(negativeSent),basis:'Checks whether verbatim tone supports the score.',formula:'Positive sentiment % >= Negative sentiment %',values:[{Metric:'Positive sentiment %',Value:positiveSent},{Metric:'Negative sentiment %',Value:negativeSent}]},
  {cat:'Risk',q:'Is unresolved customer risk low?',ok:Number.isFinite(unresolvedShare)&&unresolvedShare<=20,unknown:!Number.isFinite(unresolvedShare),basis:'Uses Owl resolution labels to check whether unresolved or pending comments are material.',formula:'Unresolved resolution share <= 20%',values:[{Metric:'Resolution rows',Value:resolutionCount},{Metric:'Unresolved/pending rows',Value:unresolvedCount},{Metric:'Unresolved share %',Value:unresolvedShare},{Metric:'Threshold %',Value:20}]},
  {cat:'Stability',q:'Is NPS stable week to week?',ok:volatility<=(5),unknown:!Number.isFinite(volatility)||scoreRows.length<2,basis:'Uses period-level standard deviation as the operating stability signal.',formula:'Period standard deviation <= 5',values:[{Metric:'Standard deviation',Value:volatility},{Metric:'Periods available',Value:scoreRows.length},{Metric:'Threshold',Value:5}]},
  {cat:'Stability',q:'Are there no hidden outlier weeks?',ok:outliers===0,unknown:!Number.isFinite(volatility)||scoreRows.length<3,basis:'Finds periods unusually far from the normal score pattern.',formula:'Outlier count = periods where abs(score - mean) > 2 * standard deviation',values:[{Metric:'Period mean',Value:meanScore},{Metric:'Standard deviation',Value:volatility},{Metric:'Outlier count',Value:outliers}]},
  {cat:'People',q:'Is agent performance spread controlled?',ok:agentSpread<=10,unknown:!Number.isFinite(agentSpread),basis:'Reveals hidden variation between strongest and weakest agent outcomes.',formula:'Max agent NPS - Min agent NPS <= 10 pts',values:[{Metric:'Agent score spread',Value:agentSpread},{Metric:'Threshold',Value:10},{Metric:'Agents available',Value:agentScores.length}]},
  {cat:'People',q:'Is manager/team spread controlled?',ok:managerSpread<=8,unknown:!Number.isFinite(managerSpread),basis:'Reveals hidden variation between strongest and weakest manager/team outcomes.',formula:'Max manager NPS - Min manager NPS <= 8 pts',values:[{Metric:'Manager score spread',Value:managerSpread},{Metric:'Threshold',Value:8},{Metric:'Managers available',Value:managerScores.length}]},
  {cat:'Drivers',q:'Is the top theme below 50% of comments?',ok:Number.isFinite(topThemeShare)&&topThemeShare<50,unknown:!Number.isFinite(topThemeShare),basis:'Detects whether one topic is dominating the customer experience story.',formula:'Top theme share < 50%',values:[{Metric:'Top theme',Value:themeDist[0]?.label||'n/a'},{Metric:'Top theme rows',Value:themeDist[0]?.count},{Metric:'Top theme share %',Value:topThemeShare},{Metric:'Threshold %',Value:50}]},
  {cat:'Drivers',q:'Are process and technology issues below half of ACPT?',ok:Number.isFinite(processTechShare)&&processTechShare<50,unknown:!Number.isFinite(processTechShare),basis:'Checks whether friction is mostly process/technology rather than frontline coaching.',formula:'Process + Technology share < 50% of ACPT classified rows',values:[{Metric:'ACPT rows',Value:acptCount},{Metric:'Process/technology rows',Value:processTechCount},{Metric:'Agent rows',Value:agentCount},{Metric:'Process/technology share %',Value:processTechShare}]},
  {cat:'Correlation',q:'Is NPS correlated with volume?',ok:Number.isFinite(volumeCorr)&&Math.abs(volumeCorr)>=0.4,unknown:!Number.isFinite(volumeCorr),basis:'Checks whether response volume and score move together strongly enough to matter.',formula:'Absolute Pearson correlation between period volume and NPS >= 0.40',values:[{Metric:'Correlation',Value:volumeCorr},{Metric:'Operational threshold',Value:0.4},{Metric:'Periods used',Value:scoreRows.length}]},
  {cat:'Correlation',q:'Does negative sentiment move against NPS?',ok:Number.isFinite(negativeCorr)&&negativeCorr<0,unknown:!Number.isFinite(negativeCorr),basis:'Checks whether higher negative sentiment is associated with lower score.',formula:'Pearson correlation between negative sentiment and NPS < 0',values:[{Metric:'Correlation',Value:negativeCorr},{Metric:'Expected direction',Value:'Negative'}]},
  {cat:'Volume',q:'Is latest response volume stable?',ok:Number.isFinite(latestVolumeChangePct)&&Math.abs(latestVolumeChangePct)<=20,unknown:!Number.isFinite(latestVolumeChangePct),basis:'Checks whether the latest volume changed within a normal operating range.',formula:'Absolute latest volume change % <= 20%',values:[{Metric:'Latest responses',Value:latest?.responses},{Metric:'Previous responses',Value:prev?.responses},{Metric:'Volume change',Value:latestVolumeChange},{Metric:'Volume change %',Value:latestVolumeChangePct},{Metric:'Threshold %',Value:20}]},
  {cat:'Volume',q:'Did volume rise while NPS fell?',ok:latest&&prev&&Number.isFinite(latestVolumeChange)&&Number.isFinite(movement)&&latestVolumeChange>0&&movement<0,unknown:!latest||!prev||!Number.isFinite(latestVolumeChange)||!Number.isFinite(movement),basis:'Flags the operational pattern where more responses arrived but the score declined.',formula:'Latest responses > previous responses AND latest NPS < previous NPS',values:latest&&prev?[{Period:'Latest',Responses:latest.responses,'NPS':latest.score},{Period:'Previous',Responses:prev.responses,'NPS':prev.score},{Metric:'Volume change',Value:latestVolumeChange},{Metric:'Score movement',Value:movement}]:[]}
 ];
 return rows.map(function(row){return {...row,status:decisionGuideStatus(row.ok,row.unknown)}})
}
function decisionGuideCategories(rows){return ['All'].concat([...new Set(rows.map(function(row){return row.cat||'Other'}))])}
function decisionGuideTab(){const rows=decisionGuideRows(),categories=decisionGuideCategories(rows),active=state.decisionGuideCategory||'All',filtered=active==='All'?rows:rows.filter(function(row){return row.cat===active});state.decisionGuideDetails=filtered;let options=categories.map(function(cat){return '<option value="'+escapeHtml(cat)+'" '+(cat===active?'selected':'')+'>'+escapeHtml(cat)+'</option>'}).join('');let body=filtered.map(function(row,index){return '<tr><td>'+(index+1)+'</td><td>'+escapeHtml(row.cat||'Other')+'</td><td>'+escapeHtml(row.q)+'</td><td><span class="decision-indicator '+row.status+'" aria-label="'+decisionGuideLabel(row.status)+'">'+decisionGuideIcon(row.status)+'</span></td><td><button class="decision-info-button" type="button" data-decision-index="'+index+'" aria-label="Calculation basis">i</button></td></tr>'}).join('');return '<section class="decision-guide-shell"><div class="decision-guide-controls"><label>Category<select id="decisionGuideCategory">'+options+'</select></label></div><div class="results-table-wrap decision-guide-wrap"><table class="decision-guide-table"><thead><tr><th>S.No</th><th>Category</th><th>Check</th><th>Status</th><th>Info</th></tr></thead><tbody>'+body+'</tbody></table></div></section>'}
function showDecisionGuideBasis(index){const detail=state.decisionGuideDetails?.[index];if(!detail)return;$('evidenceStatus').textContent='DECISION GUIDE - CALCULATION BASIS';$('evidenceTitle').textContent=detail.q;$('evidenceAnswer').textContent=decisionGuideLabel(detail.status);$('evidenceMethod').textContent=detail.basis;$('evidenceDerived').textContent=detail.status==='yes'?'Tick mark':detail.status==='no'?'X mark':'Unable to derive';$('evidenceLogic').textContent=detail.formula;$('evidenceStatistics').textContent='Indicator rule: tick = yes, X = no, ! = not enough data to derive.';$('evidenceGuardrail').textContent='Use this as a quick decision signal. For audit detail, review Performance Overview, Results, and the relevant lens cards.';const rows=Array.isArray(detail.values)?detail.values:[];if(!rows.length){$('evidenceTable').innerHTML='<p class="table-hint">No additional values were available for this decision.</p>'}else{const columns=[...new Set(rows.flatMap(function(row){return Object.keys(row)}))].slice(0,8);$('evidenceTable').innerHTML='<h3 class="evidence-data-title">Values used</h3><div class="results-table-wrap"><table class="evidence-table"><thead><tr>'+columns.map(function(column){return '<th>'+escapeHtml(column)+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(row){return '<tr>'+columns.map(function(column){return '<td>'+escapeHtml(typeof row[column]==='number'?Number(row[column]).toFixed(2):row[column]??'')+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'}$('evidenceDialog').showModal()}
function bindDecisionGuide(){const select=$('decisionGuideCategory');if(select)select.onchange=function(){state.decisionGuideCategory=select.value;renderResultTab('decision')};document.querySelectorAll('[data-decision-index]').forEach(function(button){button.onclick=function(){showDecisionGuideBasis(Number(button.dataset.decisionIndex))}})}

function dashboardGuideForTab(tab){const messages={dataset:'This is the Analysis Review Dashboard. Data Set Summary confirms the file, row count, field coverage, warnings, and readiness before anyone reads the results.',performance:'Performance Overview is the fast business read. Use it to check score, movement, volume, volatility, best and weakest periods, and sentiment signals where available.',decision:'Decision Guide gives a yes/no control checklist. Tick means yes, X means no, and ! means the current data cannot derive the answer. Use the info icon for calculation basis.',themes:'Themes Overview summarizes Owl theme distribution, coverage, resolution mix, and sample verbatims from the completed row output.',acpt:'ACPT shows ownership classification across Agent, Customer, Process, and Technology-style buckets, plus resolution status where available.',dimensions:'Dimensions detects useful enriched fields such as Location, Site, Region, Channel, Product, and Queue. Pick a dimension to see group-level score, volume, sentiment, and dynamic questions.',custom:'Custom Views lets you build ranked views from uploaded fields and analyzed outputs. Choose a field, Top or Bottom, a metric, and row count to create a compact review list.',results:'Results is the audit table and interpretive readout in one place. Open any question to see the answer, interpretation, method, derived result, guardrail, and supporting data points behind it.',sentiment:'Sentiment Briefing summarizes comment-based signals where sentiment or themes were enabled. Use it to review tone, drivers, and evidence from verbatims.',readout:'Insights Readout is the role-based view. Use QA, TL, Operations Manager, VP, or Client lenses to see the same analysis framed for each audience.'};const message=messages[tab]||messages.dataset;guideSay(message,'success completion-docked');addGuideDashboardButton()}

function sentimentRows(){const rows=[...(state.analysis?.feedbackRows||[]),...(state.analysis?.feedbackTableRows||[]),...(state.analysis?.preview||[])];const seen=new Set();return rows.filter(row=>{const key=JSON.stringify(row);if(seen.has(key))return false;seen.add(key);return true})}
function sentimentValue(row){const raw=String(row?.Sentiment??row?.sentiment??row?.['Sparrow Sentiment']??row?.['Sentiment Label']??row?.Tone??row?.tone??'').trim().toLowerCase();if(raw.startsWith('pos'))return'Positive';if(raw.startsWith('neg'))return'Negative';if(raw.startsWith('neu'))return'Neutral';return''}
function sentimentScore(row){const sentiment=sentimentValue(row);return sentiment==='Positive'?1:sentiment==='Negative'?-1:sentiment==='Neutral'?0:NaN}
function rowField(row,names){for(const name of names){if(row&&row[name]!=null&&String(row[name]).trim()!=='')return row[name]}return''}
function sentimentPeriodRows(rows){const map=new Map();rows.forEach(row=>{const raw=rowField(row,['Feedback Date','Date','Response Date','Conversation Date','CallDateTime','Period','Week']);const d=new Date(raw);if(Number.isNaN(d.getTime()))return;const key=d.toISOString().slice(0,10),sentiment=sentimentValue(row);if(!sentiment)return;const item=map.get(key)||{Period:key,total:0,Positive:0,Neutral:0,Negative:0,scores:[]};item.total++;item[sentiment]++;item.scores.push(sentimentScore(row));map.set(key,item)});return [...map.values()].map(item=>({...item,nss:item.total?((item.Positive-item.Negative)/item.total*100):NaN,avg:avg(item.scores)})).sort((a,b)=>String(a.Period).localeCompare(String(b.Period)))}
function groupSentiment(rows,field){const map=new Map();rows.forEach(row=>{const name=String(rowField(row,[field])||'Blank / Not available'),sentiment=sentimentValue(row);if(!sentiment)return;const item=map.get(name)||{name,total:0,Positive:0,Neutral:0,Negative:0,scores:[]};item.total++;item[sentiment]++;item.scores.push(sentimentScore(row));map.set(name,item)});return [...map.values()].map(item=>({...item,nss:item.total?((item.Positive-item.Negative)/item.total*100):NaN,posPct:item.total?item.Positive/item.total*100:NaN,negPct:item.total?item.Negative/item.total*100:NaN,avg:avg(item.scores)})).sort((a,b)=>b.nss-a.nss)}
function sentimentStats(){const rows=sentimentRows(),classified=rows.filter(row=>sentimentValue(row));const totalVerbatims=rows.length||Number(state.analysis?.population?.rows||0)||Number(state.base?.rows||0)||0;const counts={Positive:0,Neutral:0,Negative:0};classified.forEach(row=>counts[sentimentValue(row)]++);const total=classified.length,positivePct=total?counts.Positive/total*100:NaN,neutralPct=total?counts.Neutral/total*100:NaN,negativePct=total?counts.Negative/total*100:NaN,nss=Number.isFinite(positivePct)&&Number.isFinite(negativePct)?positivePct-negativePct:NaN;const periods=sentimentPeriodRows(classified),latest=periods.at(-1),previous=periods.at(-2),movement=latest&&previous?latest.nss-previous.nss:NaN;const agents=groupSentiment(classified,'Agent Name'),managers=groupSentiment(classified,'Manager/TL');const classificationRate=totalVerbatims?total/totalVerbatims*100:NaN;const confidence=total>=500?'High':total>=100?'Moderate':total>0?'Directional':'No evidence';return{rows,classified,totalVerbatims,total,counts,positivePct,neutralPct,negativePct,nss,periods,latest,previous,movement,agents,managers,bestAgent:agents[0],weakAgent:agents.at(-1),bestManager:managers[0],weakManager:managers.at(-1),classificationRate,confidence}}
function sentimentEvidenceRows(stats){return[{Metric:'Positive',Count:stats.counts.Positive,Share:Number.isFinite(stats.positivePct)?fmt(stats.positivePct)+'%':'n/a'},{Metric:'Neutral',Count:stats.counts.Neutral,Share:Number.isFinite(stats.neutralPct)?fmt(stats.neutralPct)+'%':'n/a'},{Metric:'Negative',Count:stats.counts.Negative,Share:Number.isFinite(stats.negativePct)?fmt(stats.negativePct)+'%':'n/a'},{Metric:'Net Sentiment',Count:'',Share:Number.isFinite(stats.nss)?fmt(stats.nss)+' pts':'n/a'}]}
function buildSentimentAnswer(questionTuple,stats,index){const number=questionTuple?.[0]??index+1,question=questionTuple?.[1]||'Sentiment signal',logic=questionTuple?.[2]||'Sentiment is calculated from classified verbatims.',statistics=questionTuple?.[3]||'Positive, Neutral, Negative, and net sentiment share.',guardrail=questionTuple?.[4]||'Use only when enough verbatims are available.';if(!stats.total)return{number,question,text:'No reliable sentiment evidence is available for this question with the current mapped data.',method:'Sentiment evidence check',logic,statistics,guardrail,status:'No evidence',evidence:[]};const lower=question.toLowerCase();let text=`Classified ${stats.total.toLocaleString()} comments: ${fmt(stats.positivePct)}% positive, ${fmt(stats.neutralPct)}% neutral, ${fmt(stats.negativePct)}% negative. Net sentiment is ${fmt(stats.nss)} pts.`,status=stats.negativePct>=25?'Review required':'Monitor',evidence=sentimentEvidenceRows(stats);if(lower.includes('positive')){text=`Positive sentiment is ${fmt(stats.positivePct)}% (${stats.counts.Positive.toLocaleString()} of ${stats.total.toLocaleString()} classified comments).`;status=stats.positivePct>=50?'Healthy':'Monitor'}else if(lower.includes('negative')){text=`Negative sentiment is ${fmt(stats.negativePct)}% (${stats.counts.Negative.toLocaleString()} of ${stats.total.toLocaleString()} classified comments).`;status=stats.negativePct>=25?'Review required':'Monitor'}else if(lower.includes('neutral')){text=`Neutral sentiment is ${fmt(stats.neutralPct)}% (${stats.counts.Neutral.toLocaleString()} of ${stats.total.toLocaleString()} classified comments).`}else if(lower.includes('confidence')||lower.includes('coverage')){text=`Sentiment confidence is ${stats.confidence}; ${fmt(stats.classificationRate)}% of available comments were classified.`;status=stats.confidence}return{number,question,text,method:'Sparrow sentiment summary from classified verbatims',logic,statistics,guardrail,status,evidence}}
function buildSentimentAnswers(){const stats=sentimentStats();return sentimentQuestions.map((question,index)=>buildSentimentAnswer(question,stats,index))}
function sentimentBriefingCards(){const answers=state.sentimentAnswers?.length?state.sentimentAnswers:buildSentimentAnswers();state.sentimentAnswers=answers;return '<section class="sentiment-table-shell"><div class="results-table-wrap sentiment-table-wrap"><table class="sentiment-briefing-table"><thead><tr><th>#</th><th>Question</th><th>Answer</th><th>Status</th><th>Action</th></tr></thead><tbody>'+answers.map((answer,index)=>'<tr data-sentiment-index="'+index+'" title="Double-click to view sentiment calculation"><td>'+(answer.number||index+1)+'</td><td>'+escapeHtml(answer.question)+'</td><td>'+escapeHtml(answer.text)+'</td><td><span class="status-pill">'+escapeHtml(answer.status||'Sentiment')+'</span></td><td>'+escapeHtml(recommendedAction(answer.status))+'</td></tr>').join('')+'</tbody></table></div><p class="table-hint">Double-click any sentiment row to view the calculation basis and supporting evidence.</p></section>'}

function renderResultTab(tab){document.querySelectorAll('.result-tab').forEach(button=>button.classList.toggle('active',button.dataset.tab===tab));$('resultTabContent').innerHTML=tab==='dataset'?datasetSummaryTab():tab==='performance'?performanceOverviewTab():tab==='decision'?decisionGuideTab():tab==='themes'?themesOverviewTab():tab==='acpt'?acptOverviewTab():tab==='dimensions'?dimensionsTab():tab==='custom'?customViewsTab():tab==='results'?resultsTable():tab==='briefing'?briefingCards():tab==='sentiment'?sentimentBriefingCards():insightsReadout();document.querySelectorAll('[data-result-index]').forEach(row=>row.ondblclick=()=>showEvidence(Number(row.dataset.resultIndex)));document.querySelectorAll('[data-briefing-index]').forEach(row=>row.ondblclick=()=>showScoreBriefingEvidence(Number(row.dataset.briefingIndex)));document.querySelectorAll('[data-sentiment-index]').forEach(row=>row.ondblclick=()=>showSentimentEvidence(Number(row.dataset.sentimentIndex)));bindPerformanceCards();if(tab==='decision')bindDecisionGuide();if(tab==='dimensions')bindDimensions();if(tab==='readout')bindLensTabs();if(tab==='custom')bindCustomViews();dashboardGuideForTab(tab)}

function derivedResult(answer){
  const rows=Array.isArray(answer?.evidence)?answer.evidence:[];
  const rawText=String(answer?.text||'').trim();
  const text=rawText.toLowerCase(),status=String(answer?.status||'').toLowerCase(),question=String(answer?.question||'').toLowerCase();
  const trend=text.match(/\b(stable|improving|declining|increasing|decreasing|flat)\b/i);
  if(trend){
    const normalized=trend[1].toLowerCase()==='flat'?'Stable':trend[1][0].toUpperCase()+trend[1].slice(1).toLowerCase();
    return normalized;
  }
  const bestWeakest=rawText.match(/\b(Best|Highest)\s+(?:week|period|month)?\s*:?\s*([^.;]+).*?\b(Weakest|Lowest)\s*:?\s*([^.;]+)/i);
  if(bestWeakest)return `${bestWeakest[1]}: ${bestWeakest[2].trim()}; ${bestWeakest[3]}: ${bestWeakest[4].trim()}`;
  const topBottom=rawText.match(/\b(Top|Best|Highest|Strongest)\s+[^:]*:\s*([^.;]+).*?\b(Bottom|Weakest|Lowest)\s+[^:]*:\s*([^.;]+)/i);
  if(topBottom)return `${topBottom[1]}: ${topBottom[2].trim()}; ${topBottom[3]}: ${topBottom[4].trim()}`;
  if(/not available|insufficient|no reliable|not mapped|too few|not enough/.test(text))return 'Insufficient evidence';
  const shouldListEntities=/agent|manager|team|tl|supervisor|associate|advisor|employee|performer/.test(question+' '+rawText);
  if(shouldListEntities){
    const nameValues=[];
    for(const row of rows){
      const value=row?.name??row?.Name??row?.['Agent Name']??row?.['Manager/TL']??row?.Manager??row?.Agent??row?.Team??row?.team??row?.Supervisor??row?.supervisor;
      if(value!==undefined&&value!==null&&String(value).trim())nameValues.push(String(value).trim());
    }
    const uniqueNames=[...new Set(nameValues)].slice(0,8);
    if(uniqueNames.length)return uniqueNames.join(', ');
  }
  const scoreMatch=rawText.match(/\b(?:csat|nps|score|sentiment|health|gap|movement|ratio|rate|share)\s+(?:is|at|of|=)\s+([-+]?\d+(?:\.\d+)?\s*(?:%|pts?)?)/i);
  if(scoreMatch)return scoreMatch[1].trim();
  if(status.includes('review'))return 'Review required';
  if(status.includes('monitor'))return 'Monitor';
  if(status.includes('action'))return 'Actionable';
  if(/above target|positive|healthy/.test(text))return 'Positive';
  if(/below target|at risk|weakest|declined|negative/.test(text))return 'Needs attention';
  return 'Directional';
}
function showEvidence(index){const answer=state.answers[index];if(!answer)return;$('evidenceStatus').textContent=`QUESTION ${answer.number||index+1} ï¿½ ${answer.status||'SUPPORTING EVIDENCE'}`;$('evidenceTitle').textContent=answer.question;$('evidenceAnswer').textContent=answer.text;$('evidenceMethod').textContent=answer.method||'Calculated from the completed local analysis';$('evidenceDerived').textContent=derivedResult(answer);$('evidenceLogic').textContent=answer.logic||'No additional framework logic was supplied.';$('evidenceStatistics').textContent=answer.statistics||answer.method||'Not specified.';$('evidenceGuardrail').textContent=answer.guardrail||'Interpret the result with the stated sample and uncertainty.';const rows=Array.isArray(answer.evidence)?answer.evidence:[];if(!rows.length){$('evidenceTable').innerHTML='<p class="table-hint">The answer and exact statistical method are shown above. No additional row-level artifact was required for this result.</p>'}else{const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))].slice(0,8);$('evidenceTable').innerHTML=`<h3 class="evidence-data-title">Actual data points</h3><div class="results-table-wrap"><table class="evidence-table"><thead><tr>${columns.map(column=>`<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,20).map(row=>`<tr>${columns.map(column=>`<td>${escapeHtml(typeof row[column]==='number'?Number(row[column]).toFixed(2):row[column]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}$('evidenceDialog').showModal()}
function showScoreBriefingEvidence(index){const answer=state.answers[index];if(!answer)return;const summary=state.analysis?.summary||{},counts=state.analysis?.counts||{};$('evidenceStatus').textContent=`RESULTS INTERPRETATION ${answer.number||index+1} - EXECUTIVE READOUT`;$('evidenceTitle').textContent=answer.question;$('evidenceAnswer').textContent=hasUsableDetail(answer)?answer.text:'This result does not have enough mapped evidence for a confident executive interpretation.';$('evidenceMethod').textContent='Results interpretation converts the completed NPS analysis into an executive explanation of score meaning, movement, risk, and recommended attention.';$('evidenceDerived').textContent=derivedResult(answer);$('evidenceLogic').textContent=answer.logic||'Interpret the completed score result in business language, then connect it to movement, gap, sample size, and operational action.';$('evidenceStatistics').textContent=answer.statistics||`NPS ${formatMetric(summary.nps ?? summary.score ?? 0)} | Total responses ${Number(summary.total || counts.total || state.base?.rows || 0).toLocaleString()}`;$('evidenceGuardrail').textContent=answer.guardrail||'Use as an executive readout. For audit-level rows and exact calculations, use the Results tab.';$('evidenceTable').innerHTML=`<div class="briefing-evidence-note"><h3 class="evidence-data-title">How to read this interpretation</h3><p>The interpretation is intentionally executive-friendly. It uses the same calculated result, but frames it as what changed, why it matters, and what leaders should review next. The Results tab remains the calculation and row-evidence view.</p></div>`;$('evidenceDialog').showModal()}
function showSentimentEvidence(index){const answer=state.sentimentAnswers[index];if(!answer)return;$('evidenceStatus').textContent=`SENTIMENT QUESTION ${answer.number||index+1} ï¿½ ${answer.status||'SUPPORTING EVIDENCE'}`;$('evidenceTitle').textContent=answer.question;$('evidenceAnswer').textContent=answer.text;$('evidenceMethod').textContent=answer.method||'Sentiment briefing calculated from completed analysis payload';$('evidenceDerived').textContent=derivedResult(answer);$('evidenceLogic').textContent=answer.logic||'No additional sentiment framework logic was supplied.';$('evidenceStatistics').textContent=answer.statistics||answer.method||'Not specified.';$('evidenceGuardrail').textContent=answer.guardrail||'Interpret the result with the stated sample and uncertainty.';const rows=Array.isArray(answer.evidence)?answer.evidence:[];if(!rows.length){$('evidenceTable').innerHTML='<p class="table-hint">The sentiment answer and statistical method are shown above. No additional row-level artifact was available for this result.</p>'}else{const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))].slice(0,8);$('evidenceTable').innerHTML=`<h3 class="evidence-data-title">Actual sentiment data points</h3><div class="results-table-wrap"><table class="evidence-table"><thead><tr>${columns.map(column=>`<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,20).map(row=>`<tr>${columns.map(column=>`<td>${escapeHtml(typeof row[column]==='number'?Number(row[column]).toFixed(2):row[column]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}$('evidenceDialog').showModal()}
function reportTable(rows,limit=24){if(!Array.isArray(rows)||!rows.length)return'<p class="muted">No additional row-level artifact was required for this result.</p>';const columns=[...new Set(rows.flatMap(row=>Object.keys(row)))].slice(0,8);return `<div class="pdf-table-wrap"><table><thead><tr>${columns.map(c=>`<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,limit).map(row=>`<tr>${columns.map(c=>`<td>${escapeHtml(typeof row[c]==='number'?Number(row[c]).toFixed(2):row[c]??'')}</td>`).join('')}</tr>`).join('')}</tbody></table>${rows.length>limit?`<p class="muted">Showing ${limit} of ${rows.length.toLocaleString()} supporting rows in the PDF preview.</p>`:''}</div>`}
function boardRoomDetailedSections(){return state.answers.map((a,i)=>{const outcome=binaryOutcome(a), badge=outcome?`<span class="answer-badge ${outcome}">${outcome==='yes'?'Yes':outcome==='no'?'No':'Not clear'}</span>`:'';return `<section class="pdf-section-shell" id="detail-${i+1}"><div class="pdf-section-heading"><span>Q${a.number||i+1}</span><strong>${escapeHtml(a.status||'Evidence')}</strong></div><article class="pdf-card"><div class="pdf-card-head"><h2>${escapeHtml(a.question)}</h2>${badge}</div><p>${escapeHtml(a.text||'No reliable answer available with the mapped data.')}</p><div class="pdf-spec-grid"><section><small>Statistical Method</small><strong>${escapeHtml(a.method||'Calculated from completed local analysis')}</strong></section><section><small>Logic From Framework</small><p>${escapeHtml(a.logic||'No additional framework logic was supplied.')}</p></section><section><small>Statistics To Use</small><p>${escapeHtml(a.statistics||a.method||'Not specified.')}</p></section><section><small>Interpretation Guardrail</small><p>${escapeHtml(a.guardrail||'Interpret with the stated sample and uncertainty.')}</p></section></div><h3>Actual data points</h3>${reportTable(a.evidence,24)}</article></section>`}).join('')}
function boardRoomLensSections(){return lensConfig.map(([id,label],index)=>{const cards=readoutCards(id),insights=lensLines(id);return `<section class="pdf-section-shell" id="lens-${escapeHtml(id)}"><div class="pdf-section-heading"><span>L${index+1}</span><strong>${escapeHtml(label)}</strong></div><article class="pdf-card"><p class="muted">${id==='client'?'Client-ready readout with employee names withheld.':'Role-specific decision readout based on the completed analysis results.'}</p><div class="pdf-lens-grid">${cards.map(card=>`<section><h3>${escapeHtml(card.label)}</h3><p><strong>${escapeHtml(card.value)}</strong></p><p>${escapeHtml((card.evidence||[]).join(' | '))}</p></section>`).join('')}</div>${insights.map((item,i)=>`<section class="pdf-insight"><h3>${i+1}. ${escapeHtml(item.title)}</h3><p><strong>Readout:</strong> ${escapeHtml(item.finding)}</p><p><strong>Action:</strong> ${escapeHtml(item.why)}</p><p><strong>Evidence:</strong> ${escapeHtml((item.evidence||[]).join(' | '))}</p></section>`).join('')}</article></section>`}).join('')}
function boardRoomIndexHtml(){const detailRows=state.answers.map((a,i)=>`<tr><td>Q${a.number||i+1}</td><td><a href="#detail-${i+1}">${escapeHtml(a.question)}</a></td><td>${escapeHtml(a.status||'Evidence')}</td><td>${escapeHtml(recommendedAction(a.status))}</td></tr>`).join('');const lensRows=lensConfig.map(([id,label],i)=>`<tr><td>L${i+1}</td><td><a href="#lens-${escapeHtml(id)}">${escapeHtml(label)}</a></td><td>Insights Readout</td><td>Role-specific summary</td></tr>`).join('');return `<section class="report-index-card" id="report-index"><p class="report-eyebrow">Report Index</p><h2>Results and insights readout</h2><p>This Board Room HTML includes each leadership question, answer, calculation logic, guardrail, and supporting data points, followed by every role-based insights lens. Use the Download PDF button inside the report when you need a PDF copy.</p><table class="report-index-table"><thead><tr><th>Ref</th><th>Section</th><th>Evidence</th><th>Action</th></tr></thead><tbody>${detailRows}${lensRows}</tbody></table></section>`}
function createBoardRoomHtml(){const reportWindow=window.open('','_blank');if(!reportWindow){alert('The Board Room HTML window was blocked. Please allow pop-ups for this local app.');return}const generatedAt=new Date().toLocaleString();const totalRows=(state.base?.rows||0).toLocaleString();const baseHref=`${window.location.origin}${window.location.pathname.replace(/[^/]*$/,'')}`;reportWindow.document.open();reportWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="${baseHref}"><title>NPS Board Room HTML</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f7fa;padding:22px;color:#0c2340;font-family:Aptos,"Segoe UI",Arial,sans-serif}.pdf-report{max-width:1320px;margin:0 auto}.pdf-cover,.report-index-card,.pdf-card{background:#fff;border:1px solid #cdddea;border-radius:10px;padding:24px 28px;margin-bottom:18px;box-shadow:0 8px 22px rgba(12,35,64,.07)}.pdf-cover{border-top:5px solid #00c9c5}.pdf-cover small,.report-eyebrow{color:#009b9b;text-transform:uppercase;letter-spacing:2px;font-weight:700;font-size:12px}.pdf-cover h1{margin:8px 0 4px;font-size:34px}.pdf-cover p,.report-index-card p,.muted{color:#52677b;line-height:1.45}.report-index-card h2{margin:0 0 6px;font-size:24px}.report-index-table,table{border-collapse:collapse;width:100%;table-layout:fixed}.report-index-table th,.report-index-table td,th,td{border:1px solid #d7e3ec;padding:9px 10px;text-align:left;font-size:10.5px;line-height:1.28;vertical-align:top;overflow-wrap:anywhere}.report-index-table th,th{background:#edf4f8;text-transform:uppercase;letter-spacing:.6px;color:#0c2340}a{color:#003d5b;text-decoration:none;border-bottom:1px solid rgba(0,155,155,.35)}.pdf-section-shell{break-before:page;page-break-before:always;margin-bottom:18px}.pdf-section-heading{display:flex;align-items:center;gap:10px;margin:0 0 10px;color:#009b9b;text-transform:uppercase;letter-spacing:1.2px;font-size:12px}.pdf-section-heading span{background:#e4f6f5;border:1px solid #9fd8d5;border-radius:999px;padding:4px 9px;color:#006f73}.pdf-section-heading strong{color:#0c2340;font-size:15px;letter-spacing:.5px}.pdf-card{break-inside:avoid;page-break-inside:avoid}.pdf-card h2{font-size:22px;margin:0 0 10px}.pdf-card h3{font-size:14px;margin:16px 0 8px}.pdf-card-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.answer-badge{flex:0 0 auto;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:700}.answer-badge.yes{background:#dff5e9;color:#13825b}.answer-badge.no{background:#fde7e8;color:#c43f49}.answer-badge.uncertain{background:#fff0c9;color:#9d6810}.pdf-spec-grid,.pdf-lens-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.pdf-spec-grid section,.pdf-lens-grid section{border:1px solid #d7e3ec;border-radius:8px;padding:12px;background:#fbfdfe}.pdf-spec-grid small{display:block;color:#009b9b;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:5px}.pdf-spec-grid strong{display:block;font-size:13px}.pdf-spec-grid p,.pdf-lens-grid li{color:#52677b;font-size:12px;line-height:1.38;margin:0}.pdf-lens-grid h3{margin:0 0 8px}.pdf-lens-grid ul{margin:0;padding-left:18px}.pdf-table-wrap{overflow:visible}.html-report-actions{position:sticky;top:0;z-index:20;display:flex;justify-content:flex-end;gap:10px;max-width:1320px;margin:0 auto 12px;padding:10px 0;background:rgba(244,247,250,.94);backdrop-filter:blur(8px)}.html-report-actions button{min-height:36px;border:1px solid #bcd5e2;border-radius:999px;background:#003f56;color:#fff;padding:0 16px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}@page{size:A4 landscape;margin:10mm}@media print{body{padding:0;background:#fff}.html-report-actions{display:none}.pdf-cover,.report-index-card,.pdf-card{box-shadow:none}}</style></head><body><div class="html-report-actions"><button onclick="window.print()">Download PDF</button></div><main class="pdf-report"><section class="pdf-cover"><small>NPS Intelligence Hub</small><h1>Board Room HTML</h1><p>Generated ${escapeHtml(generatedAt)}. Includes Results, Insights Readout, calculation logic, guardrails, and actual supporting data points. Total rows processed: ${escapeHtml(totalRows)}.</p></section>${boardRoomIndexHtml()}${boardRoomDetailedSections()}${boardRoomLensSections()}</main></body></html>`);reportWindow.document.close()}
async function downloadResultsExcel(){const button=$('downloadResults');if(button){button.disabled=true;button.classList.add('is-busy');button.innerHTML='<span>...</span><em>Preparing</em>'}try{if(!state.sentimentAnswers?.length)state.sentimentAnswers=buildSentimentAnswers();const response=await fetch('/api/export/leadership-results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target:state.rules.target,minimumSample:state.rules.minimumSample,mode:'nps',promoterMin:state.rules.satisfiedMin,passiveMin:state.rules.neutralMin,rules:state.rules,mapping:state.mapping,base:{fileName:state.base?.file?.name||'',fileSize:state.base?.file?.size||0,rows:state.base?.rows||0,columns:state.base?.columns||[],columnStats:state.base?.stats||{},processingTime:state.analysisProcessingTime||'',sheetCount:state.base?.sheetCount||1,warnings:state.base?.warnings||[]},analysis:state.analysis||{},scoreAnswers:state.answers||[],sentimentAnswers:state.sentimentAnswers||[],datasetSummary:datasetSummaryData()})});if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||'Excel export could not be created.')}const blob=await response.blob();const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='NPS_Leadership_Results.xlsx';document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url)}catch(error){alert(error.message)}finally{if(button){button.disabled=false;button.classList.remove('is-busy');button.textContent='Download Excel'}}}
function showAnalysisCompleteAnimation(){state.step=7;setScreen('ANALYSIS COMPLETE','Your Analysis Review Dashboard is ready.','The Analysis Engine has finished this run. I prepared the review dashboard so you can validate the file, inspect evidence, review insights, and decide whether to open the Detailed Dashboard.',`<section class="analysis-finished-card"><div class="bingo-orbit" aria-hidden="true"><span></span><span></span><strong>OK</strong></div><div class="bingo-copy"><span class="eyebrow">READY FOR REVIEW</span><h2>Analysis completed in ${escapeHtml(state.analysisProcessingTime||'recorded time')}.</h2><p>Open the Analysis Review Dashboard first. It includes Data Set Summary, Performance Overview, Decision Guide, Custom Views, Results, Sentiment Briefing, Insights Readout, export options, and the handoff to the Detailed Dashboard.</p><div class="completion-performance-preview">${performanceOverviewTab()}</div><div class="button-row completion-actions"><button class="btn primary" id="openReviewDashboard" type="button">Open Analysis Review Dashboard</button><button class="btn ghost" id="openDetailedDashboardFromComplete" type="button">Open Detailed Dashboard</button><button class="btn ghost" id="runAnotherAnalysis" type="button">Run Another Analysis</button></div></div></section>`);guideSay('Analysis complete. Your Analysis Review Dashboard is ready. Open it to review summaries, evidence, custom views, and role-based insights. Later, I can take you to the Detailed Dashboard for deeper visual exploration.','success','#openReviewDashboard');openReviewDashboard.onclick=showResults;openDetailedDashboardFromComplete.onclick=openDetailedDashboard;bindPerformanceCards();runAnotherAnalysis.onclick=()=>{clearCompletionFocus();Object.assign(state,{step:0,base:null,lookup:null,coverage:null,mapping:{},customDimensions:[],analysis:null,answers:[],sentimentAnswers:[]});typeof showWelcome==='function'?showWelcome():showUpload()}}
function showResults(){state.step=7;if(!state.sentimentAnswers?.length)state.sentimentAnswers=buildSentimentAnswers();setScreen('ANALYSIS REVIEW DASHBOARD','Review this completed analysis.',`This dashboard is built from the analysis you just completed. Start with Performance Overview, use Decision Guide for quick yes/no checks, then use Themes Overview, ACPT, Dimensions, Custom Views, Results, Sentiment Briefing, and Insights Readout as needed.`,`<div class="result-toolbar"><div class="result-tabs"><button class="result-tab active" data-tab="dataset"><span class="tab-icon tab-dataset" aria-hidden="true"></span>Data Set Summary</button><button class="result-tab" data-tab="performance"><span class="tab-icon tab-score" aria-hidden="true"></span>Performance Overview</button><button class="result-tab" data-tab="decision"><span class="tab-icon tab-results" aria-hidden="true"></span>Decision Guide</button><button class="result-tab" data-tab="themes"><span class="tab-icon tab-results" aria-hidden="true"></span>Themes Overview</button><button class="result-tab" data-tab="acpt"><span class="tab-icon tab-results" aria-hidden="true"></span>ACPT</button><button class="result-tab" data-tab="dimensions"><span class="tab-icon tab-results" aria-hidden="true"></span>Dimensions</button><button class="result-tab" data-tab="custom"><span class="tab-icon tab-results" aria-hidden="true"></span>Custom Views</button><button class="result-tab" data-tab="results"><span class="tab-icon tab-results" aria-hidden="true"></span>Results</button><button class="result-tab" data-tab="sentiment"><span class="tab-icon tab-sentiment" aria-hidden="true"></span>Sentiment Briefing</button><button class="result-tab" data-tab="readout"><span class="tab-icon tab-readout" aria-hidden="true"></span>Insights Readout</button></div></div><div id="resultTabContent"></div><div class="button-row">${btn('Open Detailed Dashboard','openDetailedDashboardFromReview',true)}${btn('Start a new analysis','restart',false)}</div>`);renderAnalysisTopActions();document.querySelectorAll('.result-tab').forEach(button=>button.onclick=()=>renderResultTab(button.dataset.tab));renderResultTab('dataset');openDetailedDashboardFromReview.onclick=openDetailedDashboard;restart.onclick=()=>{clearCompletionFocus();Object.assign(state,{step:0,base:null,lookup:null,coverage:null,mapping:{},customDimensions:[],analysis:null,answers:[],sentimentAnswers:[],dimensionView:null,dimensionQuestionDetails:[]});showUpload()};setTimeout(showCompletionGuide,450)}
function restoredFileName(files){const base=files?.base||files?.baseFile||files?.Base||files?.uploaded_base||files?.uploadedBase;if(typeof base==='string')return base;if(base&&typeof base==='object')return base.name||base.filename||base.fileName||base.path||'Completed analysis workbook';return'Completed analysis workbook'}
async function restoreCompletedAnalysis(){setScreen('RESTORING ANALYSIS','Opening your completed analysis.','I am loading the completed results, evidence tables, and readout tabs from the local analyzer.',`<div class="action-panel"><div class="upload-zone"><div class="upload-icon">&#8634;</div><div><strong>Loading completed analysis</strong><p>Please wait while I reopen the Data Set Summary, Results, Sentiment Briefing, and Insights Readout.</p></div></div></div>`);try{const response=await fetch('/api/status',{cache:'no-store'});const payload=await response.json();const analysis=payload.analysis||{};const rows=Number(analysis.population?.rows||analysis.summary?.total||0);if(!rows){showUpload();return}state.analysis=analysis;state.base={file:{name:restoredFileName(payload.files)},rows,columns:payload.base_columns||[],stats:payload.base_column_stats||{},guesses:payload.guesses||{},processingTime:'Recorded',sheetCount:1,warnings:[]};state.mapping={...(payload.guesses||{})};const engines=analysis.analysisEngines||{};const modelPaths=analysis.modelPaths||{};state.rules={...state.rules,sparrow:String(engines.sentiment||'').toLowerCase().includes('sparrow'),theme:String(engines.theme||'').toLowerCase() !== 'local',acpt:String(engines.theme||'').toLowerCase() !== 'local',resolutionStatus:String(engines.theme||'').toLowerCase() !== 'local',sparrowPath:modelPaths.sparrow||state.rules.sparrowPath,themeModelPath:modelPaths.theme||state.rules.themeModelPath||DEFAULT_THEME_MODEL_PATH,weekStart:analysis.calendar?.weekStart||state.rules.weekStart||'Sun',fiscalYearStartMonth:analysis.calendar?.fiscalYearStartMonth||state.rules.fiscalYearStartMonth||1};try{const stats=await post('/api/leadership-statistics',{mode:'nps',target:state.rules.target,minimumSample:state.rules.minimumSample,promoterMin:state.rules.satisfiedMin,passiveMin:state.rules.neutralMin});state.answers=stats.questions||[]}catch(error){console.warn('Could not restore NPS rigorous statistics; using completed aggregate payload.',error);state.answers=questions.map((question,index)=>({question:question[0],...calculateAnswer(index,state.analysis),method:'NPS aggregate from completed analysis',status:'Directional'}))}state.sentimentAnswers=buildSentimentAnswers();state.analysisProcessingTime='Recorded';showResults()}catch(error){showProcessError('Restore completed analysis',error,'Loading completed results')}}
function num(v){const n=Number(v);return Number.isFinite(n)?n:NaN}function avg(a){const x=a.filter(Number.isFinite);return x.length?x.reduce((s,v)=>s+v,0)/x.length:NaN}function std(a){const m=avg(a);return Number.isFinite(m)?Math.sqrt(avg(a.map(x=>(x-m)**2))):NaN}function fmt(v){return Number.isFinite(Number(v))?Number(v).toFixed(2):'n/a'}function signed(v){return Number.isFinite(Number(v))?`${v>=0?'+':''}${Number(v).toFixed(2)}`:'n/a'}function nameOf(r){return String(r['Agent Name']||r['Manager/TL']||r.Manager||r.Agent||'Not available')}function wait(ms){return new Promise(r=>setTimeout(r,ms))}function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('baseInput').onchange=e=>upload('base',e.target.files[0]);$('lookupInput').onchange=e=>upload('lookup',e.target.files[0]);if($('helpButton'))$('helpButton').onclick=()=>$('helpDialog').showModal();$('helpClose').onclick=()=>$('helpDialog').close();$('evidenceClose').onclick=()=>$('evidenceDialog').close();const guideControl=$('guideAvatar'),guideRobot=guideControl?.querySelector('.guide-person');if(guideControl&&guideRobot){guideRobot.setAttribute('role','button');guideRobot.setAttribute('tabindex','0');guideRobot.setAttribute('aria-label','Show or hide Signal Guide');guideRobot.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();toggleGuide()});guideRobot.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();toggleGuide()}})}if(new URLSearchParams(window.location.search).get('resume')==='results')restoreCompletedAnalysis();else showWelcome();














































