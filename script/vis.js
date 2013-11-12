/**
 * TODO
 *   - Add help.
 *   - Bar chart is too far to the right for grids with column names. See if this can easily be changed.
 */


var CONST = {
  appName    : "ProgVis",
  cookies    : { days: 355 },
  defTopN    : 10,  // the default 'n' in the "Top n" group
  log        : { sep01: ",", sep02: ":" },  // separators used for logging
  msg        : {
    actLoadRec_notFound: "Many applogies. Due to an error the activity you have selected is not available at this time despite being on the recommended list. Please select a different activity."
  },
  scrollTime : 500,  // after how much time log scrolling position [ms]
  vis       : {
    barAbsL          : { w:600, h:160, padding: { l:35, r: 1, t:4, b: 4 }, bar:    {        padding:1 },          sepX: 20, scales: { y: [0,1]    }, axes: { y: { ticks:3, tickValues: [0.00, 0.50, 1.00],               refLines: [0.25, 0.50, 0.75] } } },
    barAbsS          : { w:600, h: 40, padding: { l:35, r: 1, t:1, b: 1 }, bar:    {        padding:1 },          sepX: 20, scales: { y: [0,1]    }, axes: { y: { ticks:2, tickValues: []                ,               refLines: []                 } } },
    barDevL          : { w:600, h:160, padding: { l:35, r: 1, t:4, b: 4 }, bar:    {        padding:1 },          sepX: 20, scales: { y: [-1,1]   }, axes: { y: { ticks:5, tickValues: [-1.00, -0.50, 0.00, 0.50, 1.00], refLines: [-0.50, 0.50]      } } },
    
    barAbsMini       : { w:300, h:100, padding: { l: 1, r:35, t:4, b: 4 }, bar:    {        padding:1 },          sepX: 10, scales: { y: [0,1]    }, axes: { y: { ticks:3, tickValues: [0.00, 0.50, 1.00],               refLines: [0.25, 0.50, 0.75] } } },
    barDevMini       : { w:300, h:100, padding: { l: 1, r:35, t:4, b: 4 }, bar:    {        padding:1 },          sepX: 10, scales: { y: [-1,1]   }, axes: { y: { ticks:5, tickValues: [-1.00, -0.50, 0.00, 0.50, 1.00], refLines: [-0.50, 0.50]      } } },
    
    bubbleAbsL       : { w:600, h:160, padding: { l:35, r: 1, t:4, b: 4 }, bubble: {        padding:6, rMax:10 }, sepX: 20, scales: { y: [0,1]    }, axes: { y: { ticks:3, tickValues: [0.00, 0.50, 1.00],               refLines: [0.25, 0.50, 0.75] } } },
    bubbleAbsS       : { w:600, h: 40, padding: { l:35, r: 1, t:1, b: 1 }, bubble: {        padding:6, rMax:10 }, sepX: 20, scales: { y: [0,1]    }, axes: { y: { ticks:2, tickValues: []                ,               refLines: []                 } } },
    bubbleDevL       : { w:600, h:160, padding: { l:35, r: 1, t:4, b: 4 }, bubble: {        padding:6, rMax:10 }, sepX: 20, scales: { y: [-1,0,1] }, axes: { y: { ticks:5, tickValues: [-1.00, -0.50, 0.00, 0.50, 1.00], refLines: [-0.50, 0.50]      } } },
    
    gridAbs          : { w:600,        padding: { l:35, r:10, t:1, b:10 }, sq:     { w: 30, padding:1 },          sepX: 15, scales: { y: [0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0]                                     } },
    gridDev          : { w:600,        padding: { l:35, r:10, t:1, b:10 }, sq:     { w: 30, padding:1 },          sepX: 15, scales: { y: [-1.0, -0.8, -0.6, -0.5, -0.4, -0.2, 0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0] } },
    
    otherIndCellH    : { def: 12, min: 2, max: 20 },  // [px]
    minCellSizeRatio : 0.25,
    mode             : { grp: 0, ind: 1 }
  },
  uriServer  : "/guanjie/"
};

var qs = {};  // query string parsed into key-value pairs

var state = {
  curr   : { usr: "", grp: "", sid: "", cid: "" },
  tabIdx : 0,
  vis : {
    act              : {
      act        : null,
      resId      : null,
      actIdx     : -1,
      rsp        : { result: -1, rec: null, fb: null },  // server's response to the activity outcome
      recIdx     : -1,  // the index of the currently selected recommended activity (in the 'state.vis.act.rsp.recomm' array)
      doUpdState : false,
    },
    grid             : {
      cornerRadius : 4,
      xLblAngle    : 45,
      cellIdxMax   : 0,
      cellIdxSel   : -1,
      cellSel      : null
    },
    isDefBubbleClip  : false,
    mode             : CONST.vis.mode.grp,
    otherIndCellH    : 12,  // [px]
    resIdx           : -2,  // there are two entries in the combo box before the first actual resource
    topicIdx         : -1,  // selected topic index
    topicSize        : {
      idx  : 0,
      attr : ""
    }
  }
};

var ui = {
  nav : { tabs: { tabs: null, cnt: 1 } },
  vis : {
    act         : { cont: null, title: null, frame: null, frameRec: null, recLst: null, recLstSel: null, fbDiffCont: null, fbDiffTxt: null, fbDiffBtns: [null, null, null], fbRecCont: null, fbRecTxt: null, fbRecBtns: [null, null, null] },
    grid        : {
      cont   : { me: null, grp: null, others: null },
      me     : { tbar: { sortBy: null, sortDir: null, sortByIdx: 0, sortDirIdx: 0 } },
      grp    : { tbar: {} },
      others : { tbar: { sortBy: null, sortDir: null, sortByIdx: 0, sortDirIdx: 0 } }
    },
    scrollTimer : null,
    svgCommon   : null,
    sunburst    : null
  }
};

var data = null;  // the data requested from the server


// ------------------------------------------------------------------------------------------------------
/**
 * This is the object which should cummulate functions which can be called from other Web apps and Web
 * pages like activities.
 */
var vis = {
  actDone: function (res) {
    var uri = CONST.uriServer + "GetContentLevels?usr=" + state.curr.usr + "&grp=" + state.curr.grp + "&sid=" + state.curr.sid + "&cid=" + state.curr.cid + "&mod=user&sid=" + state.curr.sid + "&lastActivityId=" + state.vis.act.act.id + "&res=" + res;
    $call("GET", uri, null, actDone_cb, true, false);
  },
  
  actUpdState: function (isImmediate) {
    if (isImmediate) {
      // TODO
    }
    else state.vis.act.doUpdState = true;
  },
  
  actLoad: function () {
    $hide(ui.vis.act.fbDiffCont);
    $hide(ui.vis.act.fbRecCont);
    ui.vis.act.fbRecTxt.innerHTML = "";
    
    log(
      "action"               + CONST.log.sep02 + "activity-reload"   + CONST.log.sep01 +
      "activity-topic-id"    + CONST.log.sep02 + getTopic().id       + CONST.log.sep01 +
      "activity-resource-id" + CONST.log.sep02 + state.vis.act.resId + CONST.log.sep01 +
      "activity-id"          + CONST.log.sep02 + getAct().id,
      true
    );
  },
  
  actSubmit: function () {
    $clsAdd(document.body, "loading");
  },
  
  loadingHide: function () {
    $clsRem(document.body, "loading");
  },
  
  loadingShow: function () {
    $clsAdd(document.body, "loading");
  }
};


// ------------------------------------------------------------------------------------------------------
/**
 * Closes an activity which has been opened before.
 */
function actClose() {
  log(
    "action"               + CONST.log.sep02 + "activity-close"    + CONST.log.sep01 +
    "activity-topic-id"    + CONST.log.sep02 + getTopic().id       + CONST.log.sep01 +
    "activity-resource-id" + CONST.log.sep02 + state.vis.act.resId + CONST.log.sep01 +
    "activity-id"          + CONST.log.sep02 + getAct().id,
    true
  );
  
  if (state.vis.act.actIdx === -1) return;
  
  ui.vis.act.frame.src = "empty.html";
  
  // (1) Hide the window:
  $hide(ui.vis.act.cont);
  
  $hide(ui.vis.act.recLst);
  $hide(ui.vis.act.fbRecCont);
  $hide(ui.vis.act.frameRec);
  $show(ui.vis.act.frame);
  
  if (ui.vis.act.recLstSel !== null) $clsRem(ui.vis.act.recLstSel, "sel");
  ui.vis.act.recLstSel = null;
  
  ui.vis.act.frame    .src = "empty.html";
  ui.vis.act.frameRec .src = "empty.html";
  
  // (2) Deselect the activity's grid cell:
  var box = state.vis.grid.cellSel.select(".grid-cell-inner").select(".box");
  box.
    transition().delay(0).duration(100).ease("easeInOutQuart").
    attr("rx", (!visDoVaryCellW() ? state.vis.grid.cornerRadius : 0)).
    attr("ry", (!visDoVaryCellW() ? state.vis.grid.cornerRadius : 0)).
    attr("filter", "").
    style("stroke", "");
  
  state.vis.grid.cellIdxSel = -1;
  state.vis.grid.cellSel    = null;
  
  // (3) Update the activity grids:
  var res = getRes(state.vis.act.resId);
  if (res.updateStateOn && (res.updateStateOn.winClose || (res.updateStateOn.winCloseIfAct && state.vis.act.doUpdState))) {
    vis.loadingShow();
    actUpdGrids(true, function () { vis.loadingHide(); });
  }
  else if (state.vis.act.recIdx >= 0) {
    var res = getRes(state.vis.act.rsp.rec[state.vis.act.recIdx].resourceId);
    if (res.updateStateOn && (res.updateStateOn.winClose || (res.updateStateOn.winCloseIfAct && state.vis.act.doUpdState))) {
      vis.loadingShow();
      actUpdGrids(true, function () { vis.loadingHide(); });
    }
  }
  
  // (4) Other:
  state.vis.act.act        = null;
  state.vis.act.resId      = null;
  state.vis.act.actIdx     = -1;
  state.vis.act.recIdx     = -1;
  state.vis.act.doUpdState = false;
}


// ------------------------------------------------------------------------------------------------------
/**
 * TODO: Optimize by only redrawing (or yet better updading) the "Me" and "Me versus group" grids.
 */
function actDone_cb(rsp) {
  state.vis.act.rsp.result = rsp.lastActivityRes;
  state.vis.act.rsp.rec    = rsp.recommendation;
  state.vis.act.rsp.fb     = rsp.feedback;
  
  log(
    "action"               + CONST.log.sep02 + "activity-done"          + CONST.log.sep01 +
    "activity-topic-id"    + CONST.log.sep02 + getTopic().id            + CONST.log.sep01 +
    "activity-resource-id" + CONST.log.sep02 + state.vis.act.resId      + CONST.log.sep01 +
    "activity-id"          + CONST.log.sep02 + getAct().id              + CONST.log.sep01 +
    "activity-result"      + CONST.log.sep02 + state.vis.act.rsp.result,
    true
  );
  
  // (1) Update the learner:
  data.learners[getMe(true)] = rsp.learner;
  
  var me = getMe(false);
  visAugmentData_addAvgTopic ([me]);
  visAugmentData_addAvgRes   ([me]);
  
  // (2) Recommended activities:
  // (2.1) Remove the previous recommendations:
  while (ui.vis.act.recLst.children.length > 2) ui.vis.act.recLst.removeChild(ui.vis.act.recLst.children[2]);
  
  // (2.2) At least one activity has been recommended:
  if (rsp.recommendation && rsp.recommendation.length > 0) {
    
    $show(ui.vis.act.recLst);
    
    $clsAdd(ui.vis.act.recLst.children[0], "sel");
    ui.vis.act.recLstSel = ui.vis.act.recLst.children[0];
    
    for (var i=0, ni=rsp.recommendation.length; i < ni; i++) {
      var rec = rsp.recommendation[i];
      
      var topic = null;
      for (var j=0, nj=data.topics.length; j < nj; j++) { if (data.topics[j].id === rec.topicId) topic = function (j) { return data.topics[j] }(j); }
      if (topic === null) continue;
      
      var act = null;
      for (var j=0, nj=topic.activities[rec.resourceId].length; j < nj; j++) { if (topic.activities[rec.resourceId][j].id === rec.activityId) act = function (j) { return topic.activities[rec.resourceId][j]; }(j); }
      if (act === null) continue;
      
      var div = $$("div", ui.vis.act.recLst)
      var scaleMe =  // TODO: Make this scale thing more general.
        d3.scale.linear().
        domain(CONST.vis.gridAbs.scales.y).
        range(["#eeeeee"].concat(colorbrewer.PuRd[data.vis.color.binCount - 1]));
      $$("span", div, null, "grid-cell", "&nbsp;&nbsp;&nbsp;&nbsp;").style.backgroundColor = scaleMe(getMe().state.activities[rec.topicId][rec.resourceId][rec.activityId].values[getRepLvl().id]);
      $$("span", div, null, null, "2." + (i+1) + ". " + act.name);
      div.onclick = function (i) {
        return function (e) {
          if (ui.vis.act.recLstSel !== null) $clsRem(ui.vis.act.recLstSel, "sel");
          
          var div = $evtTgt(e);
          if (div.nodeName.toLowerCase() !== "div") div = div.parentNode;  // in case a nested span element has been clicked
          $clsAdd(div, "sel");
          ui.vis.act.recLstSel = div;
          
          actLoadRec(i);
        };
      }(i);
    }
  }
  
  // (2.3) Nothing has been recommended:
  else {
    $hide(ui.vis.act.recLst);
    $hide(ui.vis.act.fbRecCont);
  }
  
  // (3) Activity feedback:
  if (state.vis.act.rsp.result === 1 && state.vis.act.rsp.fb && state.vis.act.rsp.fb.id) {
    $show(ui.vis.act.fbDiffCont);
    ui.vis.act.fbDiffBtns[0].prop("checked", false).button("refresh");
    ui.vis.act.fbDiffBtns[1].prop("checked", false).button("refresh");
    ui.vis.act.fbDiffBtns[2].prop("checked", false).button("refresh");
  }
  else {
    $hide(ui.vis.act.fbDiffCont);
  }
  
  // (4) Update the activity grids:
  var res = getRes(state.vis.act.resId);
  if (res.updateStateOn && res.updateStateOn.done) actUpdGrids(false, null);
  
  // (5) Other:
  vis.loadingHide();
}


// ------------------------------------------------------------------------------------------------------
function actFbDiff(val) {
  var uri = CONST.uriServer + "StoreFeedback?usr=" + state.curr.usr + "&grp=" + state.curr.grp + "&sid=" + state.curr.sid + "&cid=" + state.curr.cid + "&srcActivityId=" + state.vis.act.act.id + "&srcActivityRes=1&feedbackId=" + state.vis.act.rsp.fb.id + "&feedbackItemsIds=ques_difficulty&responses=" + val + "&recommendationId=";
  $call("GET", uri, null, null, true, false);
  
  log(
    "action"                  + CONST.log.sep02 + "activity-feedback-set-difficulty" + CONST.log.sep01 +
    "activity-topic-id"       + CONST.log.sep02 + getTopic().id                      + CONST.log.sep01 +
    "activity-resource-id"    + CONST.log.sep02 + state.vis.act.resId                + CONST.log.sep01 +
    "activity-id"             + CONST.log.sep02 + getAct().id                        + CONST.log.sep01 +
    "feedback-id"             + CONST.log.sep02 + state.vis.act.rsp.fb.id            + CONST.log.sep01 +
    "feedback"                + CONST.log.sep02 + val,
    true
  );
}


// ------------------------------------------------------------------------------------------------------
function actFbRec(val) {
  var rec = getRec();
  if (!rec._rt) rec._rt = {};
  rec._rt.fb = val;
  
  var uri = CONST.uriServer + "StoreFeedback?usr=" + state.curr.usr + "&grp=" + state.curr.grp + "&sid=" + state.curr.sid + "&cid=" + state.curr.cid + "&srcActivityId=" + state.vis.act.act.id + "&srcActivityRes=" + state.vis.act.rsp.result + "&feedbackId=&feedbackItemsIds=&responses=" + val + "&recommendationId=" + getRec().recommendationId;
  $call("GET", uri, null, null, true, false);
  
  log(
    "action"                           + CONST.log.sep02 + "activity-recommended-feedback-set" + CONST.log.sep01 +
    "activity-original-topic-id"       + CONST.log.sep02 + getTopic().id                       + CONST.log.sep01 +
    "activity-original-resource-id"    + CONST.log.sep02 + state.vis.act.resId                 + CONST.log.sep01 +
    "activity-original-id"             + CONST.log.sep02 + getAct().id                         + CONST.log.sep01 +
    "activity-recommended-topic-id"    + CONST.log.sep02 + rec.topicId                         + CONST.log.sep01 +
    "activity-recommended-resource-id" + CONST.log.sep02 + rec.resourceId                      + CONST.log.sep01 +
    "activity-recommended-id"          + CONST.log.sep02 + rec.activityId                      + CONST.log.sep01 +
    "recommendation-id"                + CONST.log.sep02 + rec.recommendationId                + CONST.log.sep01 +
    "recommendation-rank"              + CONST.log.sep02 + rec.rank                            + CONST.log.sep01 +
    "recommendation-score"             + CONST.log.sep02 + rec.score                           + CONST.log.sep01 +
    "feedback"                         + CONST.log.sep02 + val,
    true
  );
}


// ------------------------------------------------------------------------------------------------------
/**
 * Loads one of the recommended activities.
 */
function actLoadRec(idx) {
  if (state.vis.act.recIdx === idx) return;
  
  // (1) Update the activity grids:
  if (state.vis.act.recIdx >= 0) {
    var res = getRes(state.vis.act.rsp.rec[state.vis.act.recIdx].resourceId);
    if (res.updateStateOn && (res.updateStateOn.winClose || (res.updateStateOn.winCloseIfAct && state.vis.act.doUpdState))) {
      vis.loadingShow();
      actUpdGrids(true, function () { vis.loadingHide(); });
    }
  }
  
  // (2) Identify topic and acticity:
  state.vis.act.recIdx = idx;
  
  var rec = getRec();
  
  var topic = null;
  for (var j=0, nj=data.topics.length; j < nj; j++) { if (data.topics[j].id === rec.topicId) topic = function (j) { return data.topics[j] }(j); }
  if (topic === null) return alert(CONST.msg.actLoadRec_notFound);
  
  var act = null;
  for (var j=0, nj=topic.activities[rec.resourceId].length; j < nj; j++) { if (topic.activities[rec.resourceId][j].id === rec.activityId) act = function (j) { return topic.activities[rec.resourceId][j]; }(j); }
  if (act === null) return alert(CONST.msg.actLoadRec_notFound);
  
  // (3) Mange frames:
  $hide(ui.vis.act.frame);
  $show(ui.vis.act.frameRec);
  
  ui.vis.act.frameRec.src = act.url + "&grp=" + state.curr.grp + "&usr=" + state.curr.usr + "&sid=" + state.curr.sid + "&cid=" + state.curr.cid;
  
  // (4) Manage feedback:
  if (rec.feedback && rec.feedback.text && rec.feedback.text.length > 0) {
    var actName = getActRec().name;
    ui.vis.act.fbRecTxt.innerHTML = rec.feedback.text.replace(actName, "2." + (idx+1) + ". " + actName);
    $show(ui.vis.act.fbRecCont);
  }
  else {
    $hide(ui.vis.act.fbRecCont);
    ui.vis.act.fbRecTxt.innerHTML = "";
  }
  
  ui.vis.act.fbRecBtns[0].prop("checked", (!rec._rt || rec._rt.fb !== 0 ? false : true)).button("refresh");
  ui.vis.act.fbRecBtns[1].prop("checked", (!rec._rt || rec._rt.fb !== 1 ? false : true)).button("refresh");
  ui.vis.act.fbRecBtns[2].prop("checked", (!rec._rt || rec._rt.fb !== 2 ? false : true)).button("refresh");
  
  // (3) Manage recommended activities:
  var scaleMe =  // TODO: Make this scale thing more general.
    d3.scale.linear().
    domain(CONST.vis.gridAbs.scales.y).
    range(["#eeeeee"].concat(colorbrewer.PuRd[data.vis.color.binCount - 1]));
  
  for (var i=0, ni=state.vis.act.rsp.rec.length; i < ni; i++) {
    var recTmp = state.vis.act.rsp.rec[i];
    var spanCell = ui.vis.act.recLst.children[i+2].children[0];  // +2 to skip to the recommended activities
    spanCell.style.backgroundColor = scaleMe(getMe().state.activities[recTmp.topicId][recTmp.resourceId][recTmp.activityId].values[getRepLvl().id]);
  }
  
  /*
  var div = $$("div", ui.vis.act.recLst)
  var scaleMe =
    d3.scale.linear().
    domain(CONST.vis.gridAbs.scales.y).
    range(["#eeeeee"].concat(colorbrewer.PuRd[data.vis.color.binCount - 1]));
  $$("span", div, null, "grid-cell", "&nbsp;&nbsp;&nbsp;&nbsp;").style.backgroundColor = scaleMe(getMe().state.activities[rec.topicId][rec.resourceId][rec.activityId].values[getRepLvl().id]);
  $$("span", div, null, null, "2." + (i+1) + ". " + act.name);
  div.onclick = function (i) {
    return function (e) {
      if (ui.vis.act.recLstSel !== null) $clsRem(ui.vis.act.recLstSel, "sel");
      
      var div = $evtTgt(e);
      if (div.nodeName.toLowerCase() !== "div") div = div.parentNode;  // in case a nested span element has been clicked
      $clsAdd(div, "sel");
      ui.vis.act.recLstSel = div;
      
      actLoadRec(i);
    };
  };
  */
  
  // (6) Log:
  log(
    "action"                           + CONST.log.sep02 + "activity-load-recommended" + CONST.log.sep01 +
    "activity-original-topic-id"       + CONST.log.sep02 + getTopic().id               + CONST.log.sep01 +
    "activity-original-resource-id"    + CONST.log.sep02 + state.vis.act.resId         + CONST.log.sep01 +
    "activity-original-id"             + CONST.log.sep02 + getAct().id                 + CONST.log.sep01 +
    "activity-recommended-topic-id"    + CONST.log.sep02 + rec.topicId                 + CONST.log.sep01 +
    "activity-recommended-resource-id" + CONST.log.sep02 + rec.resourceId              + CONST.log.sep01 +
    "activity-recommended-id"          + CONST.log.sep02 + rec.activityId              + CONST.log.sep01 +
    "recommendation-id"                + CONST.log.sep02 + rec.recommendationId        + CONST.log.sep01 +
    "recommendation-rank"              + CONST.log.sep02 + rec.rank                    + CONST.log.sep01 +
    "recommendation-score"             + CONST.log.sep02 + rec.score,
    true
  );
}


// ------------------------------------------------------------------------------------------------------
/**
 * Loads the original activity (typically accessed from the recommended-activities side bar).
 */
function actLoadRecOriginal() {
  if (state.vis.act.recIdx === -1) return;
  
  // (1) Update the activity grids:
  if (state.vis.act.recIdx >= 0) {
    var res = getRes(state.vis.act.rsp.rec[state.vis.act.recIdx].resourceId);
    if (res.updateStateOn && (res.updateStateOn.winClose || (res.updateStateOn.winCloseIfAct && state.vis.act.doUpdState))) {
      vis.loadingShow();
      actUpdGrids(true, function () { vis.loadingHide(); });
    }
  }
  
  // (2) The rest:
  state.vis.act.recIdx = -1;
  
  if (ui.vis.act.recLstSel !== null) $clsRem(ui.vis.act.recLstSel, "sel");
  
  $clsAdd(ui.vis.act.recLst.children[0], "sel");
  ui.vis.act.recLstSel = ui.vis.act.recLst.children[0];
  
  $hide(ui.vis.act.fbRecCont);
  ui.vis.act.fbRecTxt.innerHTML = "";
  
  $show(ui.vis.act.frame);
  $hide(ui.vis.act.frameRec);
  
  log(
    "action"               + CONST.log.sep02 + "activity-load-original" + CONST.log.sep01 +
    "activity-topic-id"    + CONST.log.sep02 + getTopic().id            + CONST.log.sep01 +
    "activity-resource-id" + CONST.log.sep02 + state.vis.act.resId      + CONST.log.sep01 +
    "activity-id"          + CONST.log.sep02 + getAct().id,
    true
  );
}


// ------------------------------------------------------------------------------------------------------
/**
 * Opens and activity.
 */
// http://adapt2.sis.pitt.edu/quizjet/quiz1.jsp?rdfID=jvariables1&act=Variables&sub=jVariables1&app=25&grp=IS172013Spring&usr=peterb&sid=7EA4F
function actOpen(resId, actIdx) {
  var topic = getTopic();
  var act = topic.activities[resId][actIdx];
  
  state.vis.act.act    = act;
  state.vis.act.resId  = resId;
  state.vis.act.actIdx = actIdx;
  
  $hide(ui.vis.act.recLst);
  $hide(ui.vis.act.fbDiffCont);
  $hide(ui.vis.act.fbRecCont);
  $hide(ui.vis.act.frameRec);
  
  $show(ui.vis.act.frame);
  $show(ui.vis.act.cont);
  
  ui.vis.act.title.innerHTML = "Topic: <b>" + topic.name + "</b> &nbsp; &bull; &nbsp; Activity: <b>" + act.name + "</b>";
  ui.vis.act.frame.src = act.url + "&grp=" + state.curr.grp + "&usr=" + state.curr.usr + "&sid=" + state.curr.sid + "&cid=" + state.curr.cid;
  
  log(
    "action"               + CONST.log.sep02 + "activity-open"     + CONST.log.sep01 +
    "activity-topic-id"    + CONST.log.sep02 + getTopic().id       + CONST.log.sep01 +
    "activity-resource-id" + CONST.log.sep02 + state.vis.act.resId + CONST.log.sep01 +
    "activity-id"          + CONST.log.sep02 + getAct().id,
    true
  );
  
  // NOTE: Old way by opening an activity in a new tab (useful as an example if more tab-code needs to be developed):
  /*
  // remove all tabs after the second one:
  for (var i = 3; i <= ui.nav.tabs.cnt; i++) {
    ui.nav.tabs.tabs.find(".ui-tabs-nav").find("#nav-tabs-tab-" + i + "-li").remove();
    ui.nav.tabs.tabs.find("#nav-tabs-tab-" + i).remove();
  }
  ui.nav.tabs.tabs.tabs("refresh");
  ui.nav.tabs.cnt = 2;
  
  // add the new tab:
  ui.nav.tabs.tabs.find(".ui-tabs-nav").append($("<li id='nav-tabs-tab-3-li'><a href='#nav-tabs-tab-3'>" + name + "</a></li>"));
  ui.nav.tabs.tabs.append("<div id='nav-tabs-tab-3'></div>");
  ui.nav.tabs.tabs.tabs("refresh");
  ui.nav.tabs.tabs.tabs("option", "active", 2);
  ui.nav.tabs.cnt = 3;
  
  // load the activity:
  var frame = $$("frame", $_("nav-tabs-tab-3"), null, "act");
  frame.src = "http://adapt2.sis.pitt.edu/quizjet/quiz1.jsp?rdfID=jvariables1&act=Variables&sub=jVariables1&app=25&grp=IS172013Spring&usr=peterb&sid=7EA4F";
  */
}


// ------------------------------------------------------------------------------------------------------
/**
 * Updates the activities grid. This function can request the new state or assume the current state 
 * already reflects any changes.
 */
function actUpdGrids(doReqState, fnCb) {
  if (doReqState) {
    var uri = CONST.uriServer + "GetContentLevels?usr=" + state.curr.usr + "&grp=" + state.curr.grp + "&mod=user&sid=" + state.curr.sid + "&cid=" + state.curr.cid + "&lastActivityId=" + state.vis.act.act.id + "&res=-1";
    $call("GET", uri, null, function () { actUpdGrids_cb(fnCb); }, true, false);
  }
  else actUpdGrids_cb(fnCb)
}


// ----^----
function actUpdGrids_cb(fnCb) {
  var cellIdxSel = state.vis.grid.cellIdxSel;  // hold (a)
  
  visDo(true, false, false);
  
  // (4.1) Set the appropriate cell as selected:
  state.vis.grid.cellIdxSel = cellIdxSel;  // fetch (a)
  state.vis.grid.cellSel    = d3.select("g[data-cell-idx='" + state.vis.grid.cellIdxSel + "']");
  
  var box = state.vis.grid.cellSel.select(".grid-cell-inner").select(".box");
  box.
    attr("rx", (!visDoVaryCellW() ? 20 : 0)).
    attr("ry", (!visDoVaryCellW() ? 20 : 0)).
    style("stroke-width", (!visDoVaryCellW() ? 1.51 : 1.51)).
    style("stroke", "black");
  
  if (fnCb) fnCb();
}


// ------------------------------------------------------------------------------------------------------
/**
 * Returns the currently selected activity (original, not recommended one).
 */
function getAct() {
  return state.vis.act.act;
}


// ------------------------------------------------------------------------------------------------------
/**
 * Returns the currently selected recommended activity (not the original one).
 */
function getActRec() {
  var rec = getRec();
  if (rec === null) return null;
  
  var topic = null;
  for (var j=0, nj=data.topics.length; j < nj; j++) { if (data.topics[j].id === rec.topicId) topic = function (j) { return data.topics[j] }(j); }
  if (topic === null) return null;
  
  var act = null;
  for (var j=0, nj=topic.activities[rec.resourceId].length; j < nj; j++) { if (topic.activities[rec.resourceId][j].id === rec.activityId) act = function (j) { return topic.activities[rec.resourceId][j]; }(j); }
  if (act === null) return null;
  
  return act;
}


// ------------------------------------------------------------------------------------------------------
/**
 * Returns the currently selected group object.  Note, that to get learners which make up that group 
 * you use the 'getOthers()' function.
 */
function getGrp() {
  return data.groups[$_("tbar-grp").selectedIndex];
}


// ------------------------------------------------------------------------------------------------------
/**
 * Returns the learner object of me (i.e., the learner viewing the visualization) or the index of that 
 * learner in the 'data.learner' array.
 */
function getMe(doRetIdx) {
  for (var i=0, ni=data.learners.length; i < ni; i++) {
    var l = data.learners[i];
    if (data.learners[i].id === data.context.learnerId) return (doRetIdx ? i : l);
  }
  return (doRetIdx ? -1 : null);
}


// ------------------------------------------------------------------------------------------------------
/**
 * Returns the list of learners who make up the currently selected group.
 */
function getOthers() {
  var grp = getGrp();
  var res = [];
  for (var i=0, ni=data.learners.length; i < ni; i++) {
    var l = data.learners[i];
    if (jQuery.inArray(l.id, grp.learnerIds) >= 0) res.push(l);
  }
  return res;
}


// ------------------------------------------------------------------------------------------------------
/**
 * Return the currently selected recommended activity.
 */
function getRec() {
  return (state.vis.act.recIdx === -1 ? null : state.vis.act.rsp.rec[state.vis.act.recIdx]);
}


// ------------------------------------------------------------------------------------------------------
/**
 * Return the resource with the specified ID.
 */
function getRes(id) {
  var res = null;
  $map(function (x) { if (x.id === id) res = x; }, data.resources);
  return res;
}


// ------------------------------------------------------------------------------------------------------
function getRepLvl() {
  return data.reportLevels[$_("tbar-rep-lvl").value];
}


// ------------------------------------------------------------------------------------------------------
function grpSet() {
  log("action" + CONST.log.sep02 + "group-set", true);
  
  visDo(true, true, true);
}


// ------------------------------------------------------------------------------------------------------
/**
 * Returns the currently selected topic.
 */
function getTopic() {
  return (state.vis.topicIdx === -1 ? null : data.topics[state.vis.topicIdx]);
}


// ------------------------------------------------------------------------------------------------------
function init() {
  qs = $getQS();
  
  state.curr.usr = qs.usr;
  state.curr.grp = qs.grp;
  state.curr.sid = qs.sid;
  state.curr.cid = qs.cid;
  
  log(
    "action"                 + CONST.log.sep02 + "app-start"                                    + CONST.log.sep01 +
    "ui-tbar-vis"            + CONST.log.sep02 + (qs["ui-tbar-vis"]            === "0" ? 0 : 1) + CONST.log.sep01 +
    "ui-tbar-mode-vis"       + CONST.log.sep02 + (qs["ui-tbar-mode-vis"]       === "0" ? 0 : 1) + CONST.log.sep01 +
    "ui-tbar-rep-lvl-vis"    + CONST.log.sep02 + (qs["ui-tbar-rep-lvl-vis"]    === "0" ? 0 : 1) + CONST.log.sep01 +
    "ui-tbar-topic-size-vis" + CONST.log.sep02 + (qs["ui-tbar-topic-size-vis"] === "0" ? 0 : 1) + CONST.log.sep01 +
    "ui-tbar-grp-vis"        + CONST.log.sep02 + (qs["ui-tbar-grp-vis"]        === "0" ? 0 : 1) + CONST.log.sep01 +
    "ui-tbar-res-vis"        + CONST.log.sep02 + (qs["ui-tbar-res-vis"]        === "0" ? 0 : 1),
    false
  );
  
  initUI();
  stateLoad();
  loadData();
}


// ------------------------------------------------------------------------------------------------------
function initUI() {
  // (1) The actual UI:
  $(document).ready(function() {
    // (1.1) Hide elements of the UI:
    // (1.1.1) Toolbar:
    if (qs["ui-tbar-vis"] === "0") {
      $("body").addClass("tbar-0")
      $("#tbar").hide();
    }
    else {
      $("body").addClass("tbar-1")
      $("#tbar").show();
      
      if (qs["ui-tbar-mode-vis"]       === "0" ? $("#tbar-mode-cont")       .hide() : $("#tbar-mode-cont")       .show());
      if (qs["ui-tbar-rep-lvl-vis"]    === "0" ? $("#tbar-rep-lvl-cont")    .hide() : $("#tbar-rep-lvl-cont")    .show());
      if (qs["ui-tbar-topic-size-vis"] === "0" ? $("#tbar-topic-size-cont") .hide() : $("#tbar-topic-size-cont") .show());
      if (qs["ui-tbar-grp-vis"]        === "0" ? $("#tbar-grp-cont")        .hide() : $("#tbar-grp-cont")        .show());
      if (qs["ui-tbar-res-vis"]        === "0" ? $("#tbar-res-cont")        .hide() : $("#tbar-res-cont")        .show());
    }
    
    // (1.2) Tooltips:
    $(document).tooltip();
    
    // (1.3) Toolbar:
    $("#tbar-mode").buttonset();
    $("#tbar-mode-01").click(function () { if (state.vis.mode === CONST.vis.mode.grp) return; state.vis.mode = CONST.vis.mode.grp; log("action" + CONST.log.sep02 + "comparison-mode-set", true); visDo(true, true, true); });
    $("#tbar-mode-02").click(function () { if (state.vis.mode === CONST.vis.mode.ind) return; state.vis.mode = CONST.vis.mode.ind; log("action" + CONST.log.sep02 + "comparison-mode-set", true); visDo(true, true, true); });
    
    // (1.4) Tabs:
    $("#nav-tabs").tabs({
      active   : state.tabIdx,
      activate : function (ev, ui) {
        state.tabIdx = ui.newTab.index();
        stateSave();
      }
    }).addClass("custom-tabs-horizontal");
    
    ui.nav.tabs.tabs = $("#nav-tabs").tabs();
    ui.vis.sunburst  = $("#sunburst")[0];
    
    // (1.5) Grids:
    ui.vis.grid.cont.me     = $("#grid-me")     [0];
    ui.vis.grid.cont.grp    = $("#grid-grp")    [0];
    ui.vis.grid.cont.others = $("#grid-others") [0];
    
    document.body.onmousewheel = function (e) {
      if (ui.scrollTimer) window.clearTimeout(ui.scrollTimer);
      
      ui.scrollTimer = window.setTimeout(
        function () {
          ui.scrollTimer = null;
          
          log(
            "action" + CONST.log.sep02 + "scroll"                    + CONST.log.sep01 +
            "y"      + CONST.log.sep02 + window.scrollY       + "px" + CONST.log.sep01 +
            "x"      + CONST.log.sep02 + window.scrollX       + "px" + CONST.log.sep01 +
            "scr-h"  + CONST.log.sep02 + window.screen.height + "px" + CONST.log.sep01 +
            "scr-w"  + CONST.log.sep02 + window.screen.width  + "px",
            true
          );
        },
        CONST.scrollTime
      );
    }
    
    // (1.6) Activity window:
    ui.vis.act.cont              = $("#act")[0];
    ui.vis.act.cont.onclick      = actClose;
    ui.vis.act.cont.onmousewheel = function (e) {  // prevent scrolling of the main window while scrolling the frame content
      $evtTgt(e).scrollTop -= e.wheelDeltaY;
      $evtPrevDef(e);
    }
    
    ui.vis.act.title      = $("#act-title")        [0];
    ui.vis.act.frame      = $("#act-frame")        [0];
    ui.vis.act.frameRec   = $("#act-frame-rec")    [0];
    ui.vis.act.recLst     = $("#act-rec-lst")      [0];
    ui.vis.act.fbDiffCont = $("#act-fb-diff-cont") [0];
    ui.vis.act.fbDiffTxt  = $("#act-fb-diff-txt")  [0];
    ui.vis.act.fbRecCont  = $("#act-fb-rec-cont")  [0];
    ui.vis.act.fbRecTxt   = $("#act-fb-rec-txt")   [0];
    
    ui.vis.act.recLst.children[0].onclick = actLoadRecOriginal;
    
    ui.vis.act.fbDiffBtns[0] = $("#act-fb-diff-btn-0");  ui.vis.act.fbDiffBtns[0] .click(function (e) { actFbDiff(0); });
    ui.vis.act.fbDiffBtns[1] = $("#act-fb-diff-btn-1");  ui.vis.act.fbDiffBtns[1] .click(function (e) { actFbDiff(1); });
    ui.vis.act.fbDiffBtns[2] = $("#act-fb-diff-btn-2");  ui.vis.act.fbDiffBtns[2] .click(function (e) { actFbDiff(2); });
    
    ui.vis.act.fbRecBtns[0]  = $("#act-fb-rec-btn-0");   ui.vis.act.fbRecBtns[0]  .click(function (e) { actFbRec(0);  });
    ui.vis.act.fbRecBtns[1]  = $("#act-fb-rec-btn-1");   ui.vis.act.fbRecBtns[1]  .click(function (e) { actFbRec(1);  });
    ui.vis.act.fbRecBtns[2]  = $("#act-fb-rec-btn-2");   ui.vis.act.fbRecBtns[2]  .click(function (e) { actFbRec(2);  });
    
    $("#act-fb-diff-cont #act-fb-diff") .buttonset();
    $("#act-fb-rec-cont  #act-fb-rec")  .buttonset();
    
    $("#act-close").button();
    
    $("#act-tbl")[0].onclick   = function (e) { $evtCancelProp(e); }  // prevent closing from onclick events
    $("#act-close")[0].onclick = actClose;
  });
  
  // (2) Reverse color scales (we need this for deviation from average -- colors associated with larger negative values should be darker and not lighter as is the case by default):
  colorbrewer.BluesRev = [];
  for (var i = 3; i <= 9; i++) {
    colorbrewer.BluesRev[i] = colorbrewer.Blues[i].slice();
    colorbrewer.BluesRev[i].reverse();
  }
  
  colorbrewer.SpectralRev = [];
  colorbrewer.SpectralRev[7] = colorbrewer.Spectral[7].slice();
  colorbrewer.SpectralRev[7].reverse();
  
  colorbrewer.SpectralRev[11] = colorbrewer.Spectral[11].slice();
  colorbrewer.SpectralRev[11].reverse();
  
  // (3) SVG common filters:
  ui.vis.svgCommon =
    d3.select(document.body).
    append("svg").
    attr("width", 0).
    attr("height", 0);
  
  // (3.1) Filter (blur):
  ui.vis.svgCommon.append("svg:defs").
    append("svg:filter").
    attr("id", "blur").
    append("svg:feGaussianBlur").
    attr("stdDeviation", 1.5);
    
  // (3.2) Filter (shadow):
  var filterShadow = ui.vis.svgCommon.append("svg:defs").
    append("svg:filter").
    attr("id", "shadow");
  filterShadow.append("svg:feGaussianBlur").
    attr("in", "SourceAlpha").
    attr("stdDeviation", 2);
  filterShadow.append("svg:feOffset").
    attr("dx", 0).
    attr("dy", 0).
    attr("result", "offsetblur");
  var feMerge = filterShadow.append("svg:feMerge");
  feMerge.append("svg:feMergeNode");
  feMerge.append("svg:feMergeNode").
    attr("in", "SourceGraphic");
}


// ------------------------------------------------------------------------------------------------------
function loadData() {
  vis.loadingShow();
  
  log("action" + CONST.log.sep02 + "data-load-start", false);
  
  (qs["data-live"] === "0"
    ? $call("GET", "/um-vis/data.js", null, loadData_cb, true, false)
    : $call("GET", "http://adapt2.sis.pitt.edu/guanjie/GetContentLevels?usr=" + state.curr.usr + "&grp=" + state.curr.grp + "&sid=" + state.curr.sid + "&cid=" + state.curr.cid + "&mod=all&avgtop=" + (isNaN(parseInt(qs["data-top-n-grp"])) || parseInt(qs["data-top-n-grp"]) <= 0 ? CONST.defTopN : qs["data-top-n-grp"]), null, loadData_cb, true, false)
  );
}


// ----^----
function loadData_cb(res) {
  // (1) Remove all tabs after the first one:
  /*
  for (var i = 2; i <= ui.nav.tabs.cnt; i++) {
    ui.nav.tabs.tabs.find(".ui-tabs-nav").find("#nav-tabs-tab-" + i + "-li").remove();
    ui.nav.tabs.tabs.find("#nav-tabs-tab-" + i).remove();
  }
  ui.nav.tabs.tabs.tabs("refresh");
  ui.nav.tabs.cnt = 1;
  */
  
  // (2) Process the data:
  data = res;
  
  if (!data.vis.color.value2color) data.vis.color.value2color = function (x) { var y = Math.log(x)*0.25 + 1;  return (y < 0 ? 0 : y); };  // use the logarithm function by default
  
  visAugmentData();
  
  data._rt = {};
  data._rt.topicsOrd = data.topics.slice(0);  // save the original topic order
  
  // (3) Init UI:
  for (var i = 0; i < data.reportLevels.length; i++) {
    var rl = data.reportLevels[i];
    $$("option", $_("tbar-rep-lvl"), null, null, rl.name).value = i;
  }
  
  for (var i = 0; i < data.groups.length; i++) {
    var grp = data.groups[i];
    $$("option", $_("tbar-grp"), null, null, grp.name).value = i;
  }
  
  for (var i = 0; i < data.resources.length; i++) {
    var r = data.resources[i];
    $$("option", $_("tbar-res"), null, null, r.name).value = i;
  }
  
  for (var i = 0; i < data.vis.topicSizeAttr.length; i++) {
    var tsa = data.vis.topicSizeAttr[i];
    $$("option", $_("tbar-topic-size"), null, null, tsa[0].toUpperCase() + tsa.substr(1)).value = tsa;
  }
  
  // (4) Generate visualization:
  visDo(true, true, true);
  
  vis.loadingHide();
  
  log("action" + CONST.log.sep02 + "data-load-end", false);
  log("action" + CONST.log.sep02 + "app-ready",     true );
}


// ------------------------------------------------------------------------------------------------------
/**
 * Requests the action provided to be logged on the server.  Context information can be added as well.
 */
function log(action, doAddCtx) {
  var uri = CONST.uriServer + "TrackAction?" +
    "usr="    + state.curr.usr + "&" +
    "grp="    + state.curr.grp + "&" +
    "sid="    + state.curr.sid + "&" +
    "cid="    + state.curr.cid + "&" +
    "action=" + action         +
      (doAddCtx
        ? CONST.log.sep01 +
          "ctx-comparison-mode-name"      + CONST.log.sep02 + (state.vis.mode === CONST.vis.mode.grp ? "grp" : "ind")            + CONST.log.sep01 +
          "ctx-report-level-id"           + CONST.log.sep02 + getRepLvl().id                                                     + CONST.log.sep01 +
          "ctx-topic-size-attribute-name" + CONST.log.sep02 + state.vis.topicSize.attr                                           + CONST.log.sep01 +
          "ctx-group-name"                + CONST.log.sep02 + getGrp().name                                                      + CONST.log.sep01 +
          "ctx-resource-id"               + CONST.log.sep02 + (state.vis.resIdx >= 0 ? data.resources[state.vis.resIdx].id : "")
        : ""
      );
  
  $call("GET", uri, null, null, true, false);
}


// ------------------------------------------------------------------------------------------------------
/**
 * Set report level (progress, knowledge, etc.)
 */
function repLvlSet() {
  log("action" + CONST.log.sep02 + "report-level-set", true);
  
  sortMe();
  sortOthers();
  visDo(true, true, true);
}


// ------------------------------------------------------------------------------------------------------
function resSet(idx) {
  state.vis.resIdx = idx - 2;  // there are two entries in the combo box before the first actual resource
  
  log("action" + CONST.log.sep02 + "resource-set", true); 
  
  visDo(true, true, true);
}


// ------------------------------------------------------------------------------------------------------
/**
 * Because the data.topics array is used to access the actual resource values for the purpose of 
 * visualization, it is enough to sort that array.
 */
function sortMe() {
  ui.vis.grid.me.tbar.sortByIdx  = ui.vis.grid.me.tbar.sortBy.selectedIndex;
  ui.vis.grid.me.tbar.sortDirIdx = ui.vis.grid.me.tbar.sortDir.selectedIndex;
  
  var by    = ui.vis.grid.me.tbar.sortBy.value;
  var isAsc = (ui.vis.grid.me.tbar.sortDir.value === "a");
  
  // (1) Sort:
  if (by === "-") return;
  
  else if (by === "original") {
    data.topics = [data.topics[0]].concat(isAsc ? data._rt.topicsOrd.slice(1) : data._rt.topicsOrd.slice(1).reverse());
  }
  
  else if (by === "topic") {
    var tmp = data._rt.topicsOrd.slice(1);
    tmp.sort(function (a,b) {
      if (a.name > b.name) return (isAsc ?  1 : -1);
      if (a.name < b.name) return (isAsc ? -1 :  1);
      return 0;
    });
    data.topics = [data.topics[0]].concat(tmp);
  }
  
  else {
    var tmp = data._rt.topicsOrd.slice(1);
    var me = getMe(false);
    tmp.sort(function (a,b) {
      return (isAsc
        ? me.state.topics[a.id].values[by][getRepLvl().id] - me.state.topics[b.id].values[by][getRepLvl().id]
        : me.state.topics[b.id].values[by][getRepLvl().id] - me.state.topics[a.id].values[by][getRepLvl().id]
      );
    });
    data.topics = [data.topics[0]].concat(tmp);
  }
  
  log(
    "action"    + CONST.log.sep02 + "me-sort" + CONST.log.sep01 +
    "by"        + CONST.log.sep02 + by        + CONST.log.sep01 +
    "ascending" + CONST.log.sep02 + (isAsc ? 1 : 0),
    true
  );
  
  // (2) Refresh visualization:
  visDo(true, true, true);
  
  /*
  // Example (http://bl.ocks.org/mbostock/3885705):
  var x0 = x.domain(
    data.sort(this.checked
      ? function(a, b) { return b.frequency - a.frequency; }
      : function(a, b) { return d3.ascending(a.letter, b.letter); })
      .map(function(d) { return d.letter; }))
      .copy();
  
  var transition = svg.transition().duration(750),
      delay = function(d, i) { return i * 50; };
  
  transition.selectAll(".bar")
      .delay(delay)
      .attr("x", function(d) { return x0(d.letter); });
  
  transition.select(".x.axis")
      .call(xAxis)
    .selectAll("g")
      .delay(delay);
  */
}


// ------------------------------------------------------------------------------------------------------
/**
 * Sorts other learners (i.e., the rest) by the specified resource.
 */
function sortOthers() {
  ui.vis.grid.others.tbar.sortByIdx  = ui.vis.grid.others.tbar.sortBy.selectedIndex;
  ui.vis.grid.others.tbar.sortDirIdx = ui.vis.grid.others.tbar.sortDir.selectedIndex;
  
  var by    = ui.vis.grid.others.tbar.sortBy.value;
  var isAsc = (ui.vis.grid.others.tbar.sortDir.value === "a");
  
  data.learners.sort(function (a,b) {
    return (isAsc
      ? a.state.topics[data.topics[0].id].values[by][getRepLvl().id] - b.state.topics[data.topics[0].id].values[by][getRepLvl().id]
      : b.state.topics[data.topics[0].id].values[by][getRepLvl().id] - a.state.topics[data.topics[0].id].values[by][getRepLvl().id]
    );
  });
  
  log(
    "action"    + CONST.log.sep02 + "others-sort" + CONST.log.sep01 +
    "by"        + CONST.log.sep02 + by            + CONST.log.sep01 +
    "ascending" + CONST.log.sep02 + (isAsc ? 1 : 0),
    true
  );
  
  visDo(false, false, true);
}


// ------------------------------------------------------------------------------------------------------
function stateLoad() {
  var c = $.cookies.get(CONST.appName);
  if (!c) return;
  
  state.tabIdx = c.tabIdx || 0;
  $("#nav-tabs").tabs("option", "active", state.tabIdx);
}


// ------------------------------------------------------------------------------------------------------
function stateSave() {
  var date = new Date();
  date.setTime(date.getTime() + (CONST.cookies.days*24*60*60*1000));
  
  $.cookies.set(
    CONST.appName,
    {
      tabIdx: state.tabIdx
    },
    { expiresAt: date }
  );
}


// ------------------------------------------------------------------------------------------------------
function svgGetMaxTextBB(T) {
  var ns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(ns, "svg");
  document.body.appendChild(svg);
  
  var res = { width:-1, height:-1 };
  for (var i=0, ni=T.length; i < ni; i++) {
    var txt = document.createElementNS(ns, "text");
    txt.appendChild(document.createTextNode(T[i]));
    svg.appendChild(txt);
    
    var bb = txt.getBBox();
    if (bb.width  > res.width ) res.width  = bb.width ;
    if (bb.height > res.height) res.height = bb.height;
  }
  
  document.body.removeChild(svg);
  
  return res;
}


// ------------------------------------------------------------------------------------------------------
function topicSizeSet(idx, attr) {
  if (idx === state.vis.topicSize.idx) return;
  state.vis.topicSize.idx  = idx;
  state.vis.topicSize.attr = attr;
  
  log("action" + CONST.log.sep02 + "topic-size-set", true);
  
  visDo(true, true, true);
}


// ------------------------------------------------------------------------------------------------------
/**
 * Augments the data received from the server (and stored in the 'data' global variables) by adding 
 * the following things to it:
 * 
 *   - The "Average" topic being the average over all actual topics (an extra grid column)
 *   - The "Average" resource being the per-topic average over all actual resources (an extra grid row)
 * 
 * Note that this is the function which should be inspected first in the case the protocol changes.  I 
 * won't get into the specifics of why I choose to do a questionable thing and add stuff to the actual 
 * data object.  Suffice to say that it makes visualization much much easier later on.
 */
function visAugmentData() {
  // (1) Add the "Average" topic:
  var newTopic = { id: "AVG", name: "AVERAGE" };
  
  for (var i=0, ni=data.vis.topicSizeAttr.length; i < ni; i++) {
    newTopic[data.vis.topicSizeAttr[i]] = 0.5;
  }
  
  data.topics.splice(0, 0, newTopic);
  visAugmentData_addAvgTopic(data.learners);
  visAugmentData_addAvgTopic(data.groups);
  
  // (2) Add the "Average" resource:
  data.resources.splice(0, 0, { id: "AVG", name: "AVERAGE" });
  visAugmentData_addAvgRes(data.learners);
  visAugmentData_addAvgRes(data.groups);
}


// ------------------------------------------------------------------------------------------------------
/**
 * Add the average topic to each element of the list supplied.  Elements of that list should contain the 
 * state object as defined in the protocol.
 */
function visAugmentData_addAvgTopic(lst) {
  for (var iElem=0, nElem=lst.length; iElem < nElem; iElem++) {
    var elem = lst[iElem];
    var newTopic = { values: {} };
    
    // (1) Sum up over topics per resource per report level:
    for (var iTopic=0, nTopic=data.topics.length; iTopic < nTopic; iTopic++) {
      var topic = data.topics[iTopic];
      if (topic.id === "AVG") continue;
      
      for (var iRes=0, nRes=data.resources.length; iRes < nRes; iRes++) {
        var res = data.resources[iRes];
        if (res.id === "AVG") continue;
      
        if (newTopic.values[res.id] == undefined) newTopic.values[res.id] = {};
        
        for (var iRepLvl=0, nRepLvl=data.reportLevels.length; iRepLvl < nRepLvl; iRepLvl++) {
          var repLvl = data.reportLevels[iRepLvl];
          if (!newTopic.values[res.id][repLvl.id]) newTopic.values[res.id][repLvl.id] = 0;
          
          newTopic.values[res.id][repLvl.id] += elem.state.topics[topic.id].values[res.id][repLvl.id];
        }
      }
    }
    
    // (2) Divide by the number of topics:
    for (var iRes=0, nRes=data.resources.length; iRes < nRes; iRes++) {
      var res = data.resources[iRes];
      if (res.id === "AVG") continue;
      
      for (var iRepLvl=0, nRepLvl=data.reportLevels.length; iRepLvl < nRepLvl; iRepLvl++) {
        var repLvl = data.reportLevels[iRepLvl];
        
        newTopic.values[res.id][repLvl.id] /= (data.topics.length - 1);  // -1 to exclude the "Average" topic which should have already been added
      }
    }
    
    // (3) Associate with the learner:
    elem.state.topics["AVG"] = newTopic;
  }
}


// ------------------------------------------------------------------------------------------------------
/**
 * Add the average resource to each element of the list supplied.  Elements of that list should contain the 
 * state object as defined in the protocol.
 */
function visAugmentData_addAvgRes(lst) {
  for (var iElem=0, nElem=lst.length; iElem < nElem; iElem++) {
    var elem = lst[iElem];
    
    for (var iTopic=0, nTopic=data.topics.length; iTopic < nTopic; iTopic++) {
      var topic = data.topics[iTopic];
      var newRes = {};
      
      // (1) Sum up over resources per report level:
      for (var iRes=0, nRes=data.resources.length; iRes < nRes; iRes++) {
        var res = data.resources[iRes];
        if (res.id === "AVG") continue;
        
        for (var iRepLvl=0, nRepLvl=data.reportLevels.length; iRepLvl < nRepLvl; iRepLvl++) {
          var repLvl = data.reportLevels[iRepLvl];
          if (newRes[repLvl.id] == undefined) newRes[repLvl.id] = 0;
          
          newRes[repLvl.id] += elem.state.topics[topic.id].values[res.id][repLvl.id];
        }
      }
      
      // (2) Divide by the number of resources:
      for (var iRepLvl=0, nRepLvl=data.reportLevels.length; iRepLvl < nRepLvl; iRepLvl++) {
        var repLvl = data.reportLevels[iRepLvl];
        
        newRes[repLvl.id] /= (data.resources.length - 1);  // -1 to exclude the "Average" resource which should have already been added
      }
      
      // (3) Associate with the topic:
      elem.state.topics[topic.id].values["AVG"] = newRes;
    }
  }
}


// ------------------------------------------------------------------------------------------------------
/**
 * Makes the entire visualization happen. The "me" and "group" part can be refreshed independently 
 * depending on the arguments. This is useful because only the "me" part should be refreshed upon the 
 * learner completing an activity.  Note, that here "me" and "group" do not denote individual grids but
 * rather those grids that "me" (i.e., the current learner) or the "group" (i.e., everyone but me) are 
 * involved in.  Same goes for "others."
 */
function visDo(doMe, doGrp, doOthers) {
  var scroll = { x: window.scrollX, y: window.scrollY };
  
  // (1) Reset:
  if (doMe)     $removeChildren(ui.vis.grid.cont.me);
  if (doGrp)    $removeChildren(ui.vis.grid.cont.grp);
  if (doOthers) $removeChildren(ui.vis.grid.cont.others);
  
  state.vis.grid.cellIdxMax = 0;
  state.vis.grid.cellIdxSel = -1;
  state.vis.grid.cellSel    = null;
  
  var topicMaxW = svgGetMaxTextBB($.map(data.topics, function (x) { return x.name; })).width + 10;
  
  // (2) Grids:
  // (2.1) Prepare "Me" toolbar:
  var tbarMe = null;
  if (doMe || doGrp) {
    tbarMe = $$("div", null, null, "grid-tbar");
    if (getTopic() === null) {  // topics grid
      // Topic order:
      $$("span", tbarMe, null, null, "Order topics by ");
      var sel = $$("select", tbarMe);
      $$("option", sel, null, null, "Original").value = "original";
      $$("option", sel, null, null, "Name").value = "topic";
      $$("option", sel, null, null, "---").value = "-";
      for (var i=0, ni=data.resources.length; i < ni; i++) {
        $$("option", sel, null, null, data.resources[i].name).value = data.resources[i].id;
      }
      sel.selectedIndex = ui.vis.grid.me.tbar.sortByIdx;
      sel.onchange = sortMe;
      ui.vis.grid.me.tbar.sortBy = sel;
      
      // Topic order direction:
      var sel = $$("select", tbarMe);
      $$("option", sel, null, null, "Low to high").value = "a";
      $$("option", sel, null, null, "High to low").value = "d";
      sel.selectedIndex = ui.vis.grid.me.tbar.sortDirIdx;
      sel.onchange = sortMe;
      ui.vis.grid.me.tbar.sortDir = sel;
    }
    else {  // activities grid
      $$("span", tbarMe, null, null, "&nbsp;");
    }
  }
  
  // (2.2) Prepare "Learners in group" toolbar:
  var tbarOther = $$("div");
  if (doOthers) {
    if (getTopic() === null) {  // topics grid
      // Learner order:
      $$("span", tbarOther, null, null, "Order learners by ");
      var sel = $$("select", tbarOther);
      for (var i=0, ni=data.resources.length; i < ni; i++) {
        $$("option", sel, null, null, data.resources[i].name).value = data.resources[i].id;
      }
      sel.onchange = sortOthers;
      sel.selectedIndex = ui.vis.grid.others.tbar.sortByIdx;
      ui.vis.grid.others.tbar.sortBy = sel;
      
      // Learner order direction:
      var sel = $$("select", tbarOther);
      $$("option", sel, null, null, "Low to high").value = "a";
      $$("option", sel, null, null, "High to low").value = "d";
      sel.selectedIndex = ui.vis.grid.others.tbar.sortDirIdx;
      sel.onchange = sortOthers;
      ui.vis.grid.others.tbar.sortDir = sel;
      
      // Cell height:
      if (state.vis.resIdx >= 0) {
        $$("span", tbarOther, null, null, " &nbsp;&nbsp;&bull;&nbsp;&nbsp; Block height ");
        var sel = $$("select", tbarOther);
        for (var i = CONST.vis.otherIndCellH.min; i <= CONST.vis.otherIndCellH.max; i++) {
          $$("option", sel, null, null, i).value = i;
        }
        sel.selectedIndex = state.vis.otherIndCellH - CONST.vis.otherIndCellH.min;
        sel.onchange = function (e) {
          state.vis.otherIndCellH = parseInt(this.value);
          log(
            "action" + CONST.log.sep02 + "others-cell-height-set"         + CONST.log.sep01 +
            "height" + CONST.log.sep02 + state.vis.otherIndCellH + "px",
            true
          );
          visDo(false, false, true);
        };
        $$("span", tbarOther, null, null, "px");
      }
    }
    else {  // activities grid
      // Cell height:
      if (state.vis.resIdx >= 0) {
        $$("span", tbarOther, null, null, "Block height ");
        var sel = $$("select", tbarOther);
        for (var i = CONST.vis.otherIndCellH.min; i <= CONST.vis.otherIndCellH.max; i++) {
          $$("option", sel, null, null, i).value = i;
        }
        sel.selectedIndex = state.vis.otherIndCellH - CONST.vis.otherIndCellH.min;
        sel.onchange = function (e) {
          state.vis.otherIndCellH = parseInt(this.value);
          visDo(false, false, true);
        };
        $$("span", tbarOther, null, null, "px");
      }
    }
  }
  
  // (2.3) Visualize:
  var fnVisGenGridData = null;
  
  // (2.3.1) All resources:
  if (state.vis.resIdx < 0) {
    fnVisGenGridData = (getTopic() === null ? visGenGridDataAllRes : visGenGridDataAllRes_act);
    
    var resNames = $map(function (x) { return x.name; }, data.resources);
    
    switch (state.vis.mode) {
      case CONST.vis.mode.grp:
        // Me + Me and group + Group:
        if (doMe) {
          visGenGrid(ui.vis.grid.cont.me,     fnVisGenGridData(null,     "me",        getMe(false), null,     $map(function (x) { return ["#eeeeee"].concat(colorbrewer.PuRd[data.vis.color.binCount - 1]);                                                    }, data.resources), true ), CONST.vis.gridAbs, "Me",                                   tbarMe,                       false, true,                     0,                           state.vis.grid.cornerRadius, topicMaxW, state.vis.grid.xLblAngle, 30, true,  BarChart, CONST.vis.barAbsMini, resNames, true );
        }
        
        if (doMe || doGrp) {
          visGenGrid(ui.vis.grid.cont.me,     fnVisGenGridData(null,     "me vs grp", getMe(false), getGrp(), $map(function (x) { return colorbrewer.BluesRev[data.vis.color.binCount - 1].concat(["#eeeeee"], colorbrewer.PuRd[data.vis.color.binCount - 1]); }, data.resources), false), CONST.vis.gridDev, "Me versus group",                      null,                         false, false,                    0,                           state.vis.grid.cornerRadius, 0,         state.vis.grid.xLblAngle, 30, true,  BarChart, CONST.vis.barDevMini, resNames, true );
        }
        
        if (doGrp) {
          visGenGrid(ui.vis.grid.cont.grp,    fnVisGenGridData(null,     "grp",       getGrp(),     null,     $map(function (x) { return ["#eeeeee"].concat(colorbrewer.Blues[data.vis.color.binCount - 1]);                                                   }, data.resources), false), CONST.vis.gridAbs, "Group",                                null,                         false, false,                    0,                           state.vis.grid.cornerRadius, 0,         state.vis.grid.xLblAngle, 30, true,  BarChart, CONST.vis.barAbsMini, resNames, true );
        }
        
        // Others:
        if (doOthers) {
          if (qs["ui-grid-others-vis"] == undefined || qs["ui-grid-others-vis"] === "1") {
          var others = getOthers();
          for (var i=0, ni=others.length; i < ni; i++) {
          var other = others[i];
          visGenGrid(ui.vis.grid.cont.others, fnVisGenGridData(null,     "others",    other,        null,     $map(function (x) { return ["#eeeeee"].concat(colorbrewer.Greys[data.vis.color.binCount - 1]);                                                   }, data.resources), false), CONST.vis.gridAbs, (i === 0 ? "Learners in group" : null), (i === 0 ? tbarOther : null), false, (i === 0 ? true : false), CONST.vis.otherIndCellH.def, 0,                           topicMaxW, state.vis.grid.xLblAngle,  0, false, null,     null,                 resNames, true );
          }
          }
        }
        break;
      
      case CONST.vis.mode.ind:
        // My progress:
        if (doMe) {
          visGenGrid(ui.vis.grid.cont.me,     fnVisGenGridData(null,     "me",        getMe(false), null,     $map(function (x) { return ["#eeeeee"].concat(colorbrewer.Greys[data.vis.color.binCount - 1]);                                                   }, data.resources), true ), CONST.vis.gridAbs, "My progress",                          tbarMe,                       false, true,                     0,                           state.vis.grid.cornerRadius, topicMaxW, state.vis.grid.xLblAngle, 30, true,  BarChart, CONST.vis.barAbsMini, resNames, true );
        }
        
        // Others:
        if (doOthers) {
          if (qs["ui-grid-others-vis"] == undefined || qs["ui-grid-others-vis"] === "1") {
          var others = getOthers();
          for (var i=0, ni=others.length; i < ni; i++) {
          var other = others[i];
          visGenGrid(ui.vis.grid.cont.grp,    fnVisGenGridData(null,     "others",    other,        null,     $map(function (x) { return ["#eeeeee"].concat(colorbrewer.Greys[data.vis.color.binCount - 1]);                                                   }, data.resources), false), CONST.vis.gridAbs, (i === 0 ? "Learners in group" : null), (i === 0 ? tbarOther : null), false, (i === 0 ? true : false), 0,                           state.vis.grid.cornerRadius, topicMaxW, state.vis.grid.xLblAngle, 30, true,  BarChart, CONST.vis.barAbsMini, resNames, true );
          }
          }
        }
        break;
    }
  }
  
  // (2.3.2) One resource:
  else {
    fnVisGenGridData = (getTopic() === null ? visGenGridDataOneRes : visGenGridDataOneRes_act);
    
    var topic = getTopic();
    var res   = data.resources[state.vis.resIdx];  // the currenly selected resource
    var act   = (topic && topic.activities ? topic.activities[res.id] || [] : []);
  
    var topicNames = (getTopic() === null ? $map(function (x) { return x.name }, data.topics) : [topic.name].concat($map(function (x) { return x.name }, act)));
    var resNames   = ["Me", "Me vs. group", "Group"];
    
    switch (state.vis.mode) {
      case CONST.vis.mode.grp:
        // My progress, deviation from group, and group:
        if (doMe || doGrp) {
          var colorScales = [
            colorbrewer.BluesRev[data.vis.color.binCount - 1].concat(["#eeeeee"], colorbrewer.PuRd[data.vis.color.binCount - 1]),
            colorbrewer.BluesRev[data.vis.color.binCount - 1].concat(["#eeeeee"], colorbrewer.PuRd[data.vis.color.binCount - 1]),
            colorbrewer.BluesRev[data.vis.color.binCount - 1].concat(["#eeeeee"], colorbrewer.PuRd[data.vis.color.binCount - 1])
          ];
          
          visGenGrid(ui.vis.grid.cont.me,     fnVisGenGridData(null,     "me vs grp", getMe(false), getGrp(), colorScales, true),                                                                                                                                                          CONST.vis.gridDev, "Me versus group",                      tbarMe,                       false, true,                     0,                           state.vis.grid.cornerRadius, topicMaxW, state.vis.grid.xLblAngle, 30, true,  BarChart, CONST.vis.barDevMini, resNames, true );
        }
        
        // Others:
        if (doGrp || doOthers) {
          if (qs["ui-grid-others-vis"] == undefined || qs["ui-grid-others-vis"] === "1") {
          var gridData = { topics: topicNames, sepX: [1], series: [] };
          var others = getOthers();
          for (var i=0, ni=others.length; i < ni; i++) {
          var other = others[i];
                                              fnVisGenGridData(gridData, "others",    other,        null,      $map(function (x) { return ["#eeeeee"].concat(colorbrewer.Greys[data.vis.color.binCount - 1]);                                                   }, data.resources), false);
          }
          visGenGrid(ui.vis.grid.cont.others, gridData,                                                                                                                                                                                                                                    CONST.vis.gridAbs, "Learners in group",                    tbarOther,                    false, true,                     state.vis.otherIndCellH,     0,                           topicMaxW, state.vis.grid.xLblAngle,  0, false, null,     null,                 resNames, false);
          }
        }
        break;
      
      case CONST.vis.mode.ind:
        // My progress:
        if (doMe) {
          visGenGrid(ui.vis.grid.cont.me,     fnVisGenGridData(null,     "me",        getMe(false), null,      [["#eeeeee"].concat(colorbrewer.Greys[6])]),                                                                                                                                CONST.vis.gridAbs, "Me",                                   tbarMe,                       false, true,                     0,                             state.vis.grid.cornerRadius, topicMaxW, state.vis.grid.xLblAngle, 30, true,  BarChart, CONST.vis.barAbsMini, resNames, true );
        }
        
        // Others:
        if (doOthers) {
          if (qs["ui-grid-others-vis"] == undefined || qs["ui-grid-others-vis"] === "1") {
          var gridData = { topics: topicNames, sepX: [1], series: [] };
          var others = getOthers();
          for (var i=0, ni=others.length; i < ni; i++) {
          var other = others[i];
                                              fnVisGenGridData(gridData, "other",     other,        null,      $map(function (x) { return ["#eeeeee"].concat(colorbrewer.Greys[data.vis.color.binCount - 1]);                                                  }, data.resources));
          }
          visGenGrid(ui.vis.grid.cont.others, gridData,                                                                                                                                                                                                                                    CONST.vis.gridAbs, "Learners in group",                    tbarOther,                    false, true,                     state.vis.otherIndCellH,     0,                           topicMaxW, state.vis.grid.xLblAngle, 0, false,  null,     null,                 resNames, false);
          }
        }
        break;
    }
  }
  
  // (3) Sunburst:
  $removeChildren(ui.vis.sunburst);
  
  // (4) Other:
  window.scrollTo(scroll.x, scroll.y);
}


// ------------------------------------------------------------------------------------------------------
/**
 * Generated data for the grid visualization based on all resources.  Separate grid data should be 
 * generated for the current learner, the group, and the deviation from the group.
 * 
 * If 'gridData' is null a new object is returned.  Otherwise, the one passed is modified.
 * 
 * If 'learner02' is defined then the difference between them and the first learner is returned.  This 
 * is utilized in the deviation from group calulations where the second learner is the group.
 */
function visGenGridDataAllRes(gridData, gridName, learner01, learner02, colorScales, doShowSeq) {
  if (gridData === null || gridData === undefined) var gridData = { gridName: gridName, topics: $map(function (x) { return x.name }, data.topics), sepX: [1], series: [] };
  
  for (var i=0, ni=data.resources.length; i < ni; i++) {
    var r = data.resources[i];
    var s = { resIdx: i, name: r.name, colorScale: colorScales[i], doShowSeq: doShowSeq, data: [] };  // new series
    
    for (var j=0, nj=data.topics.length; j < nj; j++) {
      var t = data.topics[j];
      s.data.push({
        topicIdx : j,
        resIdx   : i,
        actIdx   : -1,
        seq      : (t.sequencing !== undefined ? t.sequencing[r.id] || 0 : 0),
        val      : learner01.state.topics[t.id].values[r.id][getRepLvl().id] - (learner02 === null ? 0 : learner02.state.topics[t.id].values[r.id][getRepLvl().id]),
        isInt    : (learner01.id === data.context.learnerId && r.id !== "AVG"),
        isVis    : true
      });
    }
    gridData.series.push(s);
  }
  
  return gridData;
}


// ------------------------------------------------------------------------------------------------------
/**
 * Generated data for the grid visualization based on only the currently selected resource.  The 
 * resulting grid data combines data for the current learner, the group, and the deviation from the 
 * group.  Therefore, separate grids are unnecessary.
 * 
 * If 'gridData' is null a new object is returned.  Otherwise, the one passed is modified.
 * 
 * If 'learner02' is defined then the difference between them and the first learner is returned.  This 
 * is utilized in the deviation from group calulations where the second learner is the group.
 */
function visGenGridDataOneRes(gridData, gridName, learner01, learner02, colorScales, doShowSeq) {
  if (gridData === null || gridData === undefined) var gridData = { gridName: gridName, topics: $map(function (x) { return x.name }, data.topics), sepX: [1], series: [] };
  
  var r = data.resources[state.vis.resIdx];  // the currenly selected resource
  var s = null;
  
  // Me:
  s = { resIdx: state.vis.resIdx, name: "Me", colorScale: colorScales[0], doShowSeq: doShowSeq, data: [] };
  
  for (var j=0, nj=data.topics.length; j < nj; j++) {
    var t = data.topics[j];
    s.data.push({
      topicIdx : j,
      resIdx   : state.vis.resIdx,
      actIdx   : -1,
      seq      : (t.sequencing !== undefined ? t.sequencing[r.id] || 0 : 0),
      val      : learner01.state.topics[t.id].values[r.id][getRepLvl().id],
      isInt    : (r.id !== "AVG"),
      isVis    : true
    });
  }
  
  gridData.series.push(s);
  
  // Me versus group:
  if (learner02 !== null) {
    s = { resIdx: state.vis.resIdx, name: "Me vs. group", colorScale: colorScales[1], doShowSeq: false, data: [] };
    
    for (var j=0, nj=data.topics.length; j < nj; j++) {
      var t = data.topics[j];
      s.data.push({
        topicIdx : j,
        resIdx   : state.vis.resIdx,
        actIdx   : -1,
        seq      : 0,
        val      : learner01.state.topics[t.id].values[r.id][getRepLvl().id] - (learner02 === null ? 0 : learner02.state.topics[t.id].values[r.id][getRepLvl().id]),
        isInt    : false,
        isVis    : true
      });
    }
    
    gridData.series.push(s);
  }
  
  // Group:
  if (learner02 !== null) {
    s = { resIdx: state.vis.resIdx, name: "Group", colorScale: colorScales[2], doShowSeq: false, data: [] };
    
    for (var j=0, nj=data.topics.length; j < nj; j++) {
      var t = data.topics[j];
      s.data.push({
        topicIdx : j,
        resIdx   : state.vis.resIdx,
        actIdx   : -1,
        seq      : 0,
        val      : -learner02.state.topics[t.id].values[r.id][getRepLvl().id],
        isInt    : false,
        isVis    : true
      });
    }
    
    gridData.series.push(s);
  }
  
  return gridData;
}


// ------------------------------------------------------------------------------------------------------
/**
 * Return grid data for activities when in all resources mode (see desription for topics above for more 
 * info).
 */
function visGenGridDataAllRes_act(gridData, gridName, learner01, learner02, colorScales, doShowSeq) {
  var topic = getTopic();
  
  // (1) Determing max number of columns:
  var colCntMax = -1;
  for (var i=0, ni=data.resources.length; i < ni; i++) {
    var res = data.resources[i];
    var act = topic.activities[res.id];
    colCntMax = Math.max(colCntMax, (act ? act.length : 0));
  }
  
  // (2) Create the gridData object if necessary:
  if (gridData === null || gridData === undefined) {
    var gridData = { gridName: gridName, topics: /*[topic.name]*/["BACK TO TOPICS"], sepX: [1], series: [] };
    for (var i = 0; i < colCntMax; i++) gridData.topics.push("");
  }
  
  // (3) Generate data:
  for (var i=0, ni=data.resources.length; i < ni; i++) {
    var res = data.resources[i];
    var act = topic.activities[res.id];
    
    // (3.1) Prepare series:
    var s = { resIdx: i, name: res.name, colorScale: colorScales[i], doShowSeq: doShowSeq, data: [] };  // new series
    
    // (3.2) Add the topic (which serves as the average over all activities):
    s.data.push({
      topicIdx : state.vis.topicIdx,
      resIdx   : i,
      actIdx   : -1,
      seq      : 0,
      val      : learner01.state.topics[topic.id].values[res.id][getRepLvl().id] - (learner02 === null || !learner01.state.topics ? 0 : learner02.state.topics[topic.id].values[res.id][getRepLvl().id]),
      isInt    : true,
      isVis    : true
    });
    
    // (3.3) Add activities:
    var colCnt = 0;
    if (act && learner01.state.activities) {
      for (var j=0, nj=act.length; j < nj; j++) {
        var a = act[j];
        s.data.push({
          topicIdx : state.vis.topicIdx,
          resIdx   : i,
          actIdx   : j,
          seq      : (a.sequencing || 0),
          val      : learner01.state.activities[topic.id][res.id][a.id].values[getRepLvl().id] - (learner02 === null || !learner01.state.activities ? 0 : learner02.state.activities[topic.id][res.id][a.id].values[getRepLvl().id]),
          isInt    : true,
          isVis    : true
        });
        colCnt++;
      }
    }
    
    // Add empty data points to make all series equal length:
    for (var j = colCnt; j < colCntMax; j++) {
      s.data.push({ resIdx: i, topicIdx: state.vis.topicIdx, actIdx: -1, seq: 0, val: 0, isInt: false, isVis: false });
    }
    
    gridData.series.push(s);
  }
  
  return gridData;
}


// ------------------------------------------------------------------------------------------------------
/**
 * Return grid data for activities when in one resource mode (see desription for topics above for more 
 * info).
 */
function visGenGridDataOneRes_act(gridData, gridName, learner01, learner02, colorScales, doShowSeq) {
  var topic = getTopic();
  var res   = data.resources[state.vis.resIdx];  // the currenly selected resource
  var act   = (topic.activities ? topic.activities[res.id] || [] : []);
  
  // (1) Determing max number of columns:
  var colCntMax = (act ? act.length : 0);
  
  // (2) Create the gridData object if necessary:
  if (gridData === null || gridData === undefined) {
    var gridData = { gridName: gridName, topics: /*[topic.name]*/["BACK TO TOPICS"].concat($map(function (x) { return x.name }, act)), sepX: [1], series: [] };
    for (var i = 0; i < colCntMax; i++) gridData.topics.push("");
  }
  
  var s      = null;  // a series
  var colCnt = 0;
  
  // (3) Generate data:
  // (3.1) Me:
  s = { resIdx: state.vis.resIdx, name: "Me", colorScale: colorScales[0], doShowSeq: doShowSeq, data: [] };
  
  // (3.1.1) Add the topic (which serves as the average over all activities):
  s.data.push({
    topicIdx : state.vis.topicIdx,
    resIdx   : state.vis.resIdx,
    actIdx   : -1,
    seq      : 0,
    val      : learner01.state.topics[topic.id].values[res.id][getRepLvl().id],
    isInt    : true,
    isVis    : true
  });
  
  // (3.1.2) Add the activities:
  colCnt = 0;
  if (act && learner01.state.activities) {
    for (var j=0, nj=act.length; j < nj; j++) {
      var a = act[j];
      s.data.push({
        topicIdx : state.vis.topicIdx,
        resIdx   : state.vis.resIdx,
        actIdx   : j,
        seq      : (a.sequencing || 0),
        val      : learner01.state.activities[topic.id][res.id][a.id].values[getRepLvl().id],
        isInt    : true,
        isVis    : true
      });
      colCnt++;
    }
  }
  
  gridData.series.push(s);
  
  // (3.2) Me versus group:
  if (learner02 !== null) {
    s = { resIdx: state.vis.resIdx, name: "Me vs. group", colorScale: colorScales[1], doShowSeq: false, data: [] };
    
    // (3.2.1) Add the topic (which serves as the average over all activities):
    s.data.push({
      topicIdx : state.vis.topicIdx,
      resIdx   : state.vis.resIdx,
      actIdx   : -1,
      seq      : 0,
      val      : learner01.state.topics[topic.id].values[res.id][getRepLvl().id],
      isInt    : true,
      isVis    : true
    });
    
    // (3.2.2) Add the activities:
    colCnt = 0;
    if (act && learner01.state.activities) {
      for (var j=0, nj=act.length; j < nj; j++) {
        var a = act[j];
        s.data.push({
          topicIdx : state.vis.topicIdx,
          resIdx   : state.vis.resIdx,
          actIdx   : j,
          seq      : 0,
          val      : learner01.state.activities[topic.id][res.id][a.id].values[getRepLvl().id] - (learner02 === null || !learner01.state.activities ? 0 : learner02.state.activities[topic.id][res.id][a.id].values[getRepLvl().id]),
          isInt    : false,
          isVis    : true
        });
        colCnt++;
      }
    }
    
    gridData.series.push(s);
  }
  
  // (3.3) Group:
  if (learner02 !== null) {
    s = { resIdx: state.vis.resIdx, name: "Group", colorScale: colorScales[2], doShowSeq: false, data: [] };
    
    // (3.2.1) Add the topic (which serves as the average over all activities):
    s.data.push({
      topicIdx : state.vis.topicIdx,
      resIdx   : state.vis.resIdx,
      actIdx   : -1,
      seq      : 0,
      val      : -learner02.state.topics[topic.id].values[res.id][getRepLvl().id],
      isInt    : true,
      isVis    : true
    });
    
    // (3.3.2) Add the activities:
    colCnt = 0;
    if (act && learner01.state.activities) {
      for (var j=0, nj=act.length; j < nj; j++) {
        var a = act[j];
        s.data.push({
          topicIdx : state.vis.topicIdx,
          resIdx   : state.vis.resIdx,
          actIdx   : j,
          seq      : 0,
          val      : -learner02.state.activities[topic.id][res.id][a.id].values[getRepLvl().id],
          isInt    : false,
          isVis    : true
        });
        colCnt++;
      }
    }
    
    gridData.series.push(s);
  }
  
  return gridData;
}


// ------------------------------------------------------------------------------------------------------
function visGenSunburstData(topic, learner01, learner02, colorScale) {
  return { topic: topic, colorScale: colorScale };
}


// ------------------------------------------------------------------------------------------------------
/**
 * Should the cell width be varied (according to the selected topic or activity variable)?
 */
function visDoVaryCellW() {
  return (state.vis.topicSize.attr.length > 0 && getTopic() === null);
}


// ------------------------------------------------------------------------------------------------------
/**
 * Generates a grid visualization.
 */
function visGenGrid(cont, gridData, settings, title, tbar, doShowYAxis, doShowXLabels, sqHFixed, cornerRadius, topicMaxW, xLblAngle, extraPaddingB, isInteractive, miniVis, miniSettings, resNames, doShowResNames) {
  var tbl = $$tbl(cont, null, "grid", 0, 0);
  
  // (1) Header:
  // Title:
  if (title !== null) {
    $setAttr($$("td", $$("tr", tbl), null, "title", title), { colspan: 2 });
  }
  
  // Toolbar:
  if (tbar !== null) {
    var td = $setAttr($$("td", $$("tr", tbl), null, "tbar"), { colspan: 2 });
    td.appendChild(tbar);
  }
  
  // (2) Generate visualization:
  // (2.1) Calculate some important values:
  var topicOffsetT = svgGetMaxTextBB([title]).height + 4;
  //var resOffsetL = svgGetMaxTextBB($.map(gridData.series, function (x) { return x.name; })).width + 10;
  var resOffsetL = svgGetMaxTextBB(resNames).width + 10;
  //var topicMaxW = svgGetMaxTextBB($.map(gridData.topics, function (x) { return x; })).width + 10;
  var topicMaxWCos = Math.ceil(topicMaxW * Math.cos((xLblAngle === 45 ? 45 : 0) * (Math.PI / 180)));
  var paddingL = (doShowYAxis ? settings.padding.l : 10);
  var paddingT = (doShowXLabels ? topicMaxWCos : 0);
  //var sqW = Math.floor((settings.w - paddingL - settings.padding.r - settings.sq.padding) / gridData.series[0].data.length);
  var sqW = settings.sq.w;
  var sqH = (sqHFixed === 0 ? sqW : sqHFixed);
  var visW = ((sqW + settings.sq.padding) * gridData.series[0].data.length) + paddingL + settings.padding.r + resOffsetL;
  var visH = ((sqH + settings.sq.padding) * gridData.series.length) + settings.padding.t + settings.padding.b + topicOffsetT + paddingT;
  var sepXAggr = 0;
  
  if (visDoVaryCellW()) {
    var topicSizeSum = $lfold(function (a,b) { return a+b; }, $map(function (x) { return visGetTopicSize(x); }, data.topics), 0);
    sqW = Math.floor(sqW / (topicSizeSum / gridData.series[0].data.length));  // in the case of equal topic sizes, the denominator is 1 and therefore wouldn't change the value of sqW, but for unequal topic sizes it scales the default sqW
  }
  
  CONST.vis.otherIndCellH.max = sqW;
  
  var tr = $$("tr", tbl);
  
  // (2.3) Prepare scales:
  var scaleX =
    d3.scale.ordinal().
    domain(gridData.topics).
    rangePoints([ paddingL + sqW / 2 + resOffsetL, visW - settings.padding.r - sqW / 2 ]);
  
  var scaleY = $map(
    function (x) {
      var scale =
        d3.scale.linear().
        domain(settings.scales.y).
        range(x.colorScale);
      return scale;
    },
    gridData.series
  );
  
  // (2.4) Prepare axes:
  // Nothing to do here at this point.
  
  // (2.5) SVG:
  var svg =
    d3.select($$("td", tr)).
    append("svg").
    attr("style", "padding-bottom: " + (gridData.series.length > 1 ? extraPaddingB : 0) + "px;").
    attr("width", visW + (gridData.sepX.length * settings.sepX) + (xLblAngle === 45 ? topicMaxWCos : 0)).
    attr("height", visH);
  
  // (2.6) Mini bar chart series:
  var mini = { svg: null, settings: miniSettings, series: {} };
  if (miniVis) {
    mini.svg = miniVis($$("td", tr), gridData, mini.settings, null, 2, false).
      //addSeries("pri", { sepX: gridData.sepX, series: $.map(data.series, function (x) { return 0; }) }, 0, "l-gray", null, null).
      addSeries("pri", gridData, 0, 0, "l-gray", function (x) { return x.val; }, null).
      setVis(false).
      style("margin-top", (topicOffsetT + paddingT - mini.settings.padding.t) + "px");
  }
  else {
    $$("td", tr);  // preserve the two-column table layout for consistency
  }
  
  // (2.7) X axis:
  if (doShowXLabels) {
    var txtX = (!visDoVaryCellW() ? (sqW / 2 - 2) : 6);  // the x-coordinate of the text label being drawn
    svg.
      append("g").
      attr("class", "x-axis").
      selectAll("text").
      data(gridData.topics).
        enter().
        append("text").
        attr("x", 1).
        attr("y", 1).
        style("text-anchor", "start").
        style("text-rendering", "geometricPrecision").
        text(function (d) { return d; }).
        attr("transform", function (d,i) {
          if ($.inArray(i, gridData.sepX) !== -1) { txtX += settings.sepX; }
          txtX += (i === 0 ? 0 : sqW * visGetTopicSize(data.topics[i-1]) + settings.sq.padding);
          return "translate(" + (resOffsetL + paddingL + txtX) + "," + (topicOffsetT + paddingT) + ") rotate(-45)";
          
          /*
          if ($.inArray(i, gridData.sepX) !== -1) { sepXAggr += settings.sepX; }
          switch (xLblAngle) {
            case 45: return "translate(" + ((-sqW / 2.5) + sepXAggr) + "," + (topicMaxWCos + 2 ) + ") rotate(-45)";
            default: return "translate(" + ((-sqW / 2.2) + sepXAggr) + "," + (topicMaxWCos + 12) + ") rotate(-90)";
          }
          */
        });
  }
  
  // (2.8) The grid:
  var gGrid = svg.
    append("g").
    attr("class", "grid");
  
  for (var iSeries = 0; iSeries < gridData.series.length; iSeries++) {
    var s = gridData.series[iSeries];
    var res = data.resources[s.resIdx];
    
    // Resource name:
    if (doShowResNames) {
      svg.
        append("text").
        attr("x", 1).
        attr("y", ((sqH * settings.sq.padding) * iSeries) + (sqH / 2) + 5 + topicOffsetT + paddingT).
        text(s.name).
        attr("class", "res").
        style("text-rendering", "geometricPrecision");
    }
    
    // Mini-series (e.g., bar chart):
    if (miniVis) {
      mini.series[res.id] = [];
      for (var j=0, nj=gridData.series[0].data.length; j < nj; j++) {
        mini.series[res.id].push(s.data[j].val);
      }
    }
    
    // Grid cells -- The group:
    var sqX = 0;  // the x-coordinate of the cell being drawn
    
    var g = gGrid.
      selectAll("grid-" + res.id).
      data(s.data).
        enter().
        append("g").
        attr("class", "grid-cell-outter").
        attr("transform", function (d,i) {
          if ($.inArray(i, gridData.sepX) !== -1) { sqX += settings.sepX; }
          sqX += (i === 0 ? 0 : sqW * visGetTopicSize(data.topics[i-1]) + settings.sq.padding);
          var x = resOffsetL + paddingL + sqX;
          var y = ((sqH + settings.sq.padding) * iSeries) + settings.padding.t + topicOffsetT + paddingT;
          return "translate(" + x + "," + y + ")";
        }).
        
        attr("data-grid-name",  gridData.gridName).
        attr("data-idx",        function (d,i) { return i; }).
        attr("data-series-idx", iSeries).
        attr("data-var-id",     res.id).
        attr("data-var-name",   res.name).
        attr("data-topic-idx",  function (d) { return d.topicIdx; }).
        attr("data-res-idx",    function (d) { return d.resIdx; }).
        attr("data-act-idx",    function (d) { return d.actIdx; }).
        attr("data-cell-idx",   function (d) { return state.vis.grid.cellIdxMax++; }).
        
        append("g").
        attr("class", "grid-cell-inner");
    
    // Grid cells -- The main element (the square):
    g.
      append("rect").
      attr("class", "box").
      attr("x", 0).
      attr("y", 0).
      attr("width", function (d,i) { return (d.isVis ? sqW * visGetTopicSize(data.topics[i]) : 0); }).
      attr("height", function (d) { return (d.isVis ? sqH : 0); }).
      attr("rx", (!visDoVaryCellW() ? cornerRadius : 0)).
      attr("ry", (!visDoVaryCellW() ? cornerRadius : 0)).
      attr("style", function (d) { var d2 = (d.val >=0 ? data.vis.color.value2color(d.val) : -data.vis.color.value2color(-d.val)); return "fill: " + scaleY[iSeries](d2) + ";"; }).
      style("shape-rendering", "geometricPrecision");
    
    // Grid cells -- Sequencing:
    if (s.doShowSeq) {
      g.
        append("circle").
        attr("class", "seq").
        attr("cx", 6).
        attr("cy", 6).
        //attr("r", function (d) { return (d.seq === 0 ? 0 : Math.max(d.seq * 4, 1)); }).
        attr("r", function (d) { return (d.seq === 0 ? 0 : 3); }).
        // append("path").
        // attr("class", "seq").
        // attr("d", function (d,i) { return (i > 0 && Math.random() <= 0.10 ? "M0,8 v-6 l2,-2 h6 z" : "M0,0"); }).
        attr("style", function (d) { return "fill: " + colorbrewer.PuRd[6][5] + ";" }).
        //attr("style", function (d) { return "fill: #000000;" }).
        style("shape-rendering", "geometricPrecision");
    }
    
    //g.on("mouseover", function (d,i) { console.log(d); })
  }
  
  // (2.9) Events:
  if (isInteractive && miniVis) {
    svg.
      on("mouseover",
        function (miniSvg) {
          return function () {
            ehVisGridMouseOver(d3.select(this), miniSvg);
          }
        }(mini.svg)
      ).
      on("mouseout",
        function (miniSvg) {
          return function () {
            ehVisGridMouseOut(d3.select(this), miniSvg);
          }
        }(mini.svg)
      );
  }
  
  if (isInteractive) {
    if (!miniVis) {
      gGrid.
        selectAll(".grid-cell-outter").
        on("mouseover", function () { ehVisGridBoxMouseOver(d3.select(this), gridData, null, null); }).
        on("mouseout", function () { ehVisGridBoxMouseOut(d3.select(this), null); }).
        on("click", function () {});
    }
    else {
      gGrid.
        selectAll(".grid-cell-outter").
        on("mouseover",
          function (gridData, miniSvg, miniSeries) {
            return function () {
              ehVisGridBoxMouseOver(d3.select(this), gridData, miniSvg, miniSeries);
            }
          }(gridData, mini.svg, mini.series)
        ).
        on("mouseout",
          function (miniSvg) {
            return function () {
              ehVisGridBoxMouseOut(d3.select(this), miniSvg);
            }
          }(mini.svg)
        ).
        on("click", function () { ehVisGridBoxClick(d3.select(this)); });
    }
  }
  
  return svg;
}


// ------------------------------------------------------------------------------------------------------
/**
 * Returns the width size of the grid cell being a proportion of the height, i.e., <0,1>.  If the width 
 * turns out to be smaller than the minimum that minimum is returned instead.
 */
function visGetTopicSize(topic) {
  if (!visDoVaryCellW()) return 1;
  
  var size = topic[state.vis.topicSize.attr];
  return (size <= CONST.vis.minCellSizeRatio ? CONST.vis.minCellSizeRatio : size);
}


// ------------------------------------------------------------------------------------------------------
function ehVisGridMouseOver(g, miniSvg) {
  miniSvg.setVis(true, 0, 250);
}


// ------------------------------------------------------------------------------------------------------
function ehVisGridMouseOut(g, miniSvg) {
  miniSvg.setVis(false, 0, 250);
}


// ------------------------------------------------------------------------------------------------------
function ehVisGridBoxMouseOver(grpOutter, gridData, miniSvg, miniSeries) {
  var grpOutterNode = grpOutter.node();
  var grpInner      = grpOutter.select(".grid-cell-inner");
  var box           = grpInner.select(".box");
  var cellIdx       = +grpOutter.attr("data-cell-idx");
  
  var cx = box.attr("width")  / 2;
  var cy = box.attr("height") / 2;
  
  /*
  for (var i=0, ni=box.node().parentNode.childNodes.length; i < ni; i++) {
    var child = box.node().parentNode.childNodes[i];
    if (child === box.node()) continue;
    d3.select(child).attr("filter", "url(#blur)");
  }
  */
  
  grpOutterNode.parentNode.appendChild(grpOutterNode);  // make the first element to move to top
  if (state.vis.grid.cellIdxSel !== cellIdx) {
    
    grpInner.
      transition().delay(0).duration(100).ease("easeInOutQuart").
      attrTween("transform", function (d,i,a) {
        if (!visDoVaryCellW()) {
          return d3.interpolateString("rotateX(0," + cx + "," + cy + ")", "rotate(45," + cx + "," + cy + ")");
        }
      });
    
    box.
      transition().delay(0).duration(100).ease("easeInOutQuart").
      attr("rx", 1).  // TODO: Change for 0 in chrome (Safari fucks up corners with 0)
      attr("ry", 1).
      style("stroke", "black").
      attr("filter", "url(#shadow)");
  }
  else {
    grpInner.
      transition().delay(0).duration(100).ease("easeInOutQuart").
      attrTween("transform", function (d,i,a) {
        if (!visDoVaryCellW()) {
          return d3.interpolateString("rotateX(0," + cx + "," + cy + ")", "rotate(45," + cx + "," + cy + ")");
        }
      });
      
    box.
      transition().delay(0).duration(100).ease("easeInOutQuart").
      attr("filter", "url(#shadow)");
  }
  
  if (miniSvg) {
    miniSvg.
      setTitle(grpOutter.attr("data-var-name")).
      updSeries("pri", gridData, parseInt(grpOutter.attr("data-series-idx"))).
      setSeriesItemClass("pri", "").
      setSeriesItemClass("pri", "l-gray", [+grpOutter.attr("data-idx")]);
  }
}


// ------------------------------------------------------------------------------------------------------
function ehVisGridBoxMouseOut(grpOutter, miniSvg) {
  var grpOutterNode = grpOutter.node();
  var grpInner      = grpOutter.select(".grid-cell-inner");
  var box           = grpInner.select(".box");
  var cellIdx       = +grpOutter.attr("data-cell-idx");
  
  var cx = box.attr("width")  / 2;
  var cy = box.attr("height") / 2;
  
  /*
  for (var i=0, ni=box.node().parentNode.childNodes.length; i < ni; i++) {
    var child = box.node().parentNode.childNodes[i];
    d3.select(child).attr("filter", "");
  }
  */
  
  if (state.vis.grid.cellIdxSel !== cellIdx) {
    grpInner.
      transition().delay(0).duration(100).ease("easeInOutQuart").
      attrTween("transform", function (d,i,a) {
        if (!visDoVaryCellW()) {
          return d3.interpolateString("rotate(45," + cx + "," + cy + ")", "rotate(0," + cx + "," + cy + ")");
        }
      });
    
    box.
      transition().delay(0).duration(100).ease("easeInOutQuart").
      attr("rx", (!visDoVaryCellW() ? state.vis.grid.cornerRadius : 0)).
      attr("ry", (!visDoVaryCellW() ? state.vis.grid.cornerRadius : 0)).
      style("stroke", "").
      attr("filter", "");
  }
  else {
    grpInner.
      transition().delay(0).duration(100).ease("easeInOutQuart").
      attrTween("transform", function (d,i,a) {
        if (!visDoVaryCellW()) {
          return d3.interpolateString("rotate(45," + cx + "," + cy + ")", "rotate(0," + cx + "," + cy + ")");
        }
      });
    
    box.
      transition().delay(0).duration(100).ease("easeInOutQuart").
      attr("filter", "");
  }
  
  if (miniSvg) {
    miniSvg.
      //zeroSeries("pri", { sepX: data.sepX, series: miniSeries[grpOutter.attr("data-var-id")] }).
      setSeriesItemClass("pri", "l-gray").
      setVis(false);
  }
}


// ------------------------------------------------------------------------------------------------------
function ehVisGridBoxClick(grpOutter) {
  var grpOutterNode = grpOutter.node();
  var grpInner      = grpOutter.select(".grid-cell-inner");
  var box           = grpInner.select(".box");
  var seq           = grpInner.select(".seq");
  var idx           = +grpOutter.attr("data-idx") - 1;
  var topicIdx      = +grpOutter.attr("data-topic-idx");
  var resIdx        = +grpOutter.attr("data-res-idx");
  var actIdx        = +grpOutter.attr("data-act-idx");
  var cellIdx       = +grpOutter.attr("data-cell-idx");
  var gridName      = grpOutter.attr("data-grid-name");
  
  var topic = data.topics[topicIdx];
  var res   = data.resources[resIdx];
  var act   = (actIdx === -1 ? null : topic.activities[res.id][actIdx]);
  
  // (1) Select:
  if (state.vis.grid.cellIdxSel !== cellIdx) {
    // (1.1) Topic grid -- The average topic has been clicked:
    if (getTopic() === null && idx === -1) return;
    
    // (1.2) Topic grid -- A topic has been clicked so we switch to activity grid:
    if (getTopic() === null && idx !== -1) {
      state.vis.grid.cellIdxSel = cellIdx;
      state.vis.grid.cellSel    = grpOutter;
      state.vis.topicIdx        = topicIdx;
      
      ui.nav.tabs.tabs.find(".ui-tabs-nav").children(0).children(0)[0].innerHTML = "TOPIC: " + topic.name;
      
      log(
        "action"           + CONST.log.sep02 + "grid-topic-cell-select" + CONST.log.sep01 +
        "grid-name"        + CONST.log.sep02 + gridName                 + CONST.log.sep01 +
        "cell-topic-id"    + CONST.log.sep02 + topic.id                 + CONST.log.sep01 +
        "cell-resource-id" + CONST.log.sep02 + res.id,
        true
      );
      
      return visDo(true, true, true);
    }
    
    // (1.3) Activity grid -- The average activity has been clicked so we go back to the topic grid:
    if (getTopic() !== null && idx === -1) {
      state.vis.grid.cellIdxSel = -1;
      state.vis.grid.cellSel    = null;
      state.vis.topicIdx        = -1;
      
      ui.nav.tabs.tabs.find(".ui-tabs-nav").children(0).children(0)[0].innerHTML = "TOPICS";
      
      log(
        "action"           + CONST.log.sep02 + "grid-activity-go-back" + CONST.log.sep01 +
        "grid-name"        + CONST.log.sep02 + gridName                + CONST.log.sep01 +
        "cell-topic-id"    + CONST.log.sep02 + topic.id                + CONST.log.sep01 +
        "cell-resource-id" + CONST.log.sep02 + res.id,
        true
      );
      
      return visDo(true, true, true);
    }
    
    // (1.4) Activity grid -- An activity has been clicked so we mark it as selected and open it:
    if (getTopic() !== null && idx !== -1) {
      // (1.4.1) Deselect the currently selected cell:
      if (state.vis.grid.cellSel !== null) {
        var boxSel = state.vis.grid.cellSel.select(".grid-cell-inner").select(".box");
        var seqSel = state.vis.grid.cellSel.select(".grid-cell-inner").select(".seq");
        
        boxSel.
          transition().delay(0).duration(100).ease("easeInOutQuart").
          attr("rx", (!visDoVaryCellW() ? state.vis.grid.cornerRadius : 0)).
          attr("ry", (!visDoVaryCellW() ? state.vis.grid.cornerRadius : 0)).
          style("stroke-width", "1").
          style("stroke", "");
        
        seqSel.style("fill", colorbrewer.PuRd[6][5]);
      }
      
      // (1.4.2) Select the new cell:
      box.
        transition().delay(0).duration(100).ease("easeInOutQuart").
        attr("rx", (!visDoVaryCellW() ? 20 : 0)).
        attr("ry", (!visDoVaryCellW() ? 20 : 0)).
        style("stroke-width", (!visDoVaryCellW() ? 1.51 : 1.51)).
        style("stroke", "black");
      
      seq.style("fill", "#000000");
      
      state.vis.grid.cellIdxSel = cellIdx;
      state.vis.grid.cellSel    = grpOutter;
      
      log(
        "action"           + CONST.log.sep02 + "grid-activity-cell-select" + CONST.log.sep01 +
        "grid-name"        + CONST.log.sep02 + gridName                    + CONST.log.sep01 +
        "cell-topic-id"    + CONST.log.sep02 + topic.id                    + CONST.log.sep01 +
        "cell-resource-id" + CONST.log.sep02 + res.id                      + CONST.log.sep01 +
        "cell-activity-id" + CONST.log.sep02 + act.id,
        true
      );
      
      if (actIdx !== -1) actOpen(res.id, actIdx);
      
      return;
    }
    
    /*
    var r = Math.random();
         if (r < 0.25) visGenSunburst(visGenSunburstData(topic, null, null, ["#eeeeee"].concat(colorbrewer.Blues[6])));
    else if (r < 0.50) visGenSunburst(visGenSunburstData(topic, null, null, ["#eeeeee"].concat(colorbrewer.PuRd[6] )));
    else if (r < 0.75) visGenSunburst(visGenSunburstData(topic, null, null, ["#eeeeee"].concat(colorbrewer.Greys[6])));
    else               visGenSunburst(visGenSunburstData(topic, null, null, colorbrewer.BluesRev[6].concat(["#eeeeee"], colorbrewer.PuRd[6])));
    */
  }
  
  // (2) Deselect:
  else {
    grpOutterNode.parentNode.appendChild(grpOutterNode);  // make the first element to move to top
    
    // (2.1) Activity grid -- An activity has been clicked so we deselect it:
    if (getTopic() !== null && idx !== -1) {
      box.
        transition().delay(0).duration(100).ease("easeInOutQuart").
        attr("filter", "url(#shadow)").
        attr("rx", 1).  // TODO: Change for 0 in Chrome (Safari fucks up corners with 0)
        attr("ry", 1).
        style("stroke-width", "1").
        style("stroke", "black");
      
      seq.style("fill", colorbrewer.PuRd[6][5]);
    }
    
    state.vis.grid.cellIdxSel = -1;
    state.vis.grid.cellSel    = null;
    
    return;
    
    /*
    $removeChildren(ui.vis.sunburst);
    */
  }
}


// ------------------------------------------------------------------------------------------------------
/**
 * Generates a sunburst visualization.
 * 
 * http://bl.ocks.org/mbostock/4063423
 * http://strongriley.github.io/d3/ex/sunburst.html
 */
function visGenSunburst(sunburstData) {
  var D = {
    name: "A", ratio: 1, val: 4,  // topic
    children: [
      {
        name: "a", ratio: 0.20, val: 2,
        children: [
          { name: "a1", ratio: 0.60, val: 2 },
          { name: "a2", ratio: 0.20, val: 1 },
          { name: "a3", ratio: 0.10, val: 2 },
          { name: "a4", ratio: 0.05, val: 2 },
          { name: "a5", ratio: 0.05, val: 2 }
        ]
      },
      {
        name: "b", ratio: 0.20, val: 4,
        children: [
          { name: "b1", ratio: 0.90, val: 3 },
          { name: "b2", ratio: 0.10, val: 5 }
        ]
      },
      {
        name: "c", ratio: 0.40, val: 6,
        children: [
          { name: "c1", ratio: 0.30, val: 6 },
          { name: "c2", ratio: 0.30, val: 5 },
          { name: "c3", ratio: 0.40, val: 5 }
        ]
      },
      {
        name: "d", ratio: 0.10, val: 6,
        children: [
          { name: "d1", ratio: 0.30, val: 6 },
          { name: "d2", ratio: 0.30, val: 6 },
          { name: "d3", ratio: 0.40, val: 5 }
        ]
      },
      {
        name: "e", ratio: 0.10, val: 6,
        children: [
          { name: "e1", ratio: 0.30, val: 6 },
          { name: "e2", ratio: 0.30, val: 6 },
          { name: "e3", ratio: 0.40, val: 6 }
        ]
      }
    ]
  };
  
  var w = 300;
  var h = 300;
  var r = Math.min(w,h) / 2;
  var color = d3.scale.category20c();
  
  $removeChildren(ui.vis.sunburst);
  
  var svg = d3.
    select(ui.vis.sunburst).
    append("svg").
    attr("width", w).
    attr("height", h).
    append("g").
    attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")");
  
  var partition = d3.layout.partition().
    sort(null).
    size([2 * Math.PI, r * r]).
    //value(function (d) { return 1; });
    value(function (d) { return d.ratio; });
  
  var arc = d3.svg.arc().
    startAngle(function (d) { return d.x; }).
    endAngle(function (d) { return d.x + d.dx; }).
    innerRadius(function (d) { return Math.sqrt(d.y); }).
    outerRadius(function (d) { return Math.sqrt(d.y + d.dy); });
  
  var path = svg.
    datum(D).
    selectAll("path").
    data(partition.nodes).
      enter().
      append("path").
      attr("display", function (d) { return d.depth ? null : "none"; }).  // hide the most inner ring
      attr("d", arc).
      style("stroke", "#ffffff").
      style("fill", function (d) { return sunburstData.colorScale[d.val]; }).
      style("fill-rule", "evenodd").
      style("shape-rendering", "geometricPrecision").
      each(stash);
  
  /*
  path.
    data(partition.value(function (d) { return d.ratio; }).nodes).
    transition().
    duration(1500).
    attrTween("d", arcTween);
  */
  
  /*
  d3.selectAll("input").on("change", function change() {
    var value = this.value === "count"
      ? function() { return 1; }
      : function(d) { return d.size; };
    
    path.
      data(partition.value(value).nodes).
      transition().
      duration(1500).
      attrTween("d", arcTween);
  });
  */
  
  // Stash the old values for transition.
  function stash(d) {
    d.x0  = d.x;
    d.dx0 = d.dx;
  }
  
  // Interpolate the arcs in data space.
  function arcTween(a) {
    var i = d3.interpolate({ x: a.x0, dx: a.dx0 }, a);
    return function(t) {
      var b = i(t);
      a.x0 = b.x;
      a.dx0 = b.dx;
      return arc(b);
    };
  }
  
  //d3.select(self.frameElement).style("height", h + "px");
}


// ------------------------------------------------------------------------------------------------------
function visResetAll() {
  // Remove all existing tables which hold visualizations:
  for (var i = 0; i < ui.vis.tbl.length; i++) {
    if (ui.vis.tbl[i]) ui.vis.tbl[i].parentNode.parentNode.removeChild(ui.vis.tbl[i].parentNode);
  }
  ui.vis.tbl = [];
  
  // Activities (old version with the activity loaded into a new tab):
  /*
  $removeChildren(ui.vis.act);
  $hide(ui.vis.act);
  */
  
  // Other:
  state.vis.grid.cellIdxMax = 0;
  state.vis.grid.cellIdxSel = -1;
  state.vis.grid.cellSel    = null;
}


// ------------------------------------------------------------------------------------------------------
function visToggleSeries(name) {
  var svg01 = ui.vis.series[name][0];
  var svg02 = ui.vis.series[name][1];
  
  if (svg01.style.display === "block") {
    $hide(svg01);
    $hide(svg02);
  }
  else {
    $show(svg01);
    $show(svg02);
  }
}
