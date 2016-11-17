/* Easy Mapper 1.2.0 by Inpyo Jeon (inpyoj@gmail.com) */

// 전역 변수 선언
var i, $img, imgWidth, imgHeight, measure, unit, posX, posY, filepath, $activeGridX, $activeGridY;
var phase = 0; // 그리드 제어 단계 (0: 시작점, 1: 종료점, 2: 수정)
var cnt = 0; // 맵 객체 수

/***********************************************************************************************
 * 1) 눈금자
 ***********************************************************************************************/
$(window).on('load', rulerInit); // 눈금자 생성 함수 호출

//눈금자 생성 함수
function rulerInit() {
	$('#workspace-ruler > div > div > div').remove(); // 기존 눈금자 초기화

	$img = $('#workspace-img-wrap');
	imgWidth = $img.width() + 1;
	imgHeight = $img.height() + 1;
	
	$('#workspace-ruler').css({ width: imgWidth, height: imgHeight }); // 이미지 사이즈에 맞춤
	$('#gnb').css({ maxWidth: imgWidth + $('#workspace-ruler-y').width() }); // 메뉴바 최대길이를 이미지 너비로 지정
	
	if ($('#gnb-menu-percent').hasClass('_active')) {
		unit = '%'; // 단위: 퍼센트
		
		// 눈금 삽입
		for (i=0;i<10;i++) {
			$('#workspace-ruler-x-1').append('<div class="workspace-ruler-x-1-el"></div>');	
			$('#workspace-ruler-x-2').append('<div class="workspace-ruler-x-2-el">'+i*10+'%</div>');
			$('#workspace-ruler-y-1').append('<div class="workspace-ruler-y-1-el"></div>');
			$('#workspace-ruler-y-2').append('<div class="workspace-ruler-y-2-el">'+i*10+'%</div>');
		}
		
		// 눈금 크기 설정
		$('.workspace-ruler-x-1-el').css({ width: imgWidth / 10 });
		$('.workspace-ruler-x-2-el').css({ width: imgWidth / 10, border: 0 });
		$('.workspace-ruler-y-1-el').css({ height: imgHeight / 10 });
		$('.workspace-ruler-y-2-el').css({ height: imgHeight / 10, border: 0 });
	} else {
		unit = 'px'; // 단위: 픽셀
		
		for (i=0;i<imgWidth/10;i++)
			$('#workspace-ruler-x-1').append('<div class="workspace-ruler-x-1-el"></div>');	
		for (i=0;i<imgWidth/50;i++)
			$('#workspace-ruler-x-2').append('<div class="workspace-ruler-x-2-el">'+i*50+'px</div>');
		for (i=0;i<imgHeight/10;i++)
			$('#workspace-ruler-y-1').append('<div class="workspace-ruler-y-1-el"></div>');	
		for (i=0;i<imgHeight/50;i++)
			$('#workspace-ruler-y-2').append('<div class="workspace-ruler-y-2-el">'+i*50+'px</div>');
	}	
}

/***********************************************************************************************
 * 2) 드롭다운 메뉴
 ***********************************************************************************************/
$(window).on('load', setMeasure); // 지정방식 함수 호출
$(document).on('click', '.gnb-menu-sub li, #gnb-menu li', menuItemClick); // 메뉴 클릭 함수 호출
$(document).on('click', '.pop-btn-cancel, #dim', popClose).on('keydown', keyEvents); // 팝업 닫기

// 메뉴 클릭 함수
function menuItemClick() {
	
	switch ($(this).attr('id')) {
		case 'gnb-menu-local':
			popOpen($('#pop-local')); // 로컬 파일 업로드 팝업 출력
			break;
			
		case 'gnb-menu-url':
			popOpen($('#pop-url')); // 웹 이미지 링크 팝업 출력
			break;
			
		case 'gnb-menu-drag':
		case 'gnb-menu-click':
			$(this).addClass('_active').siblings('li').removeClass('_active');
			setMeasure(); // 지정방식 함수 호출
			break;
			
		case 'gnb-menu-percent':
		case 'gnb-menu-pixel':
			if (!$(this).hasClass('_active')) {
				if (confirm('Changing the unit will clear all the map elements. Do you want to continue?')) {
					$(this).addClass('_active').siblings('li').removeClass('_active');
					rulerInit(); // 눈금자 생성 함수 호출
					resetMapElView(); // 맵 엘리먼트 삭제
				}
			}			
			break;
		
		case 'gnb-menu-clear':
			if (confirm('Do you want to delete all the map elements?')) resetMapElView(); // 맵 엘리먼트 삭제
			else return;
			break;
			
		case 'gnb-menu-generate':
			generateCode(); // 코드 생성 함수 호출
			break;
			
		case 'gnb-menu-info':
			popOpen($('#pop-info')); // 도움말 팝업 출력
			break;
	}
}

// 지정방식 함수
function setMeasure() {
	measure = ($('#gnb-menu-drag').hasClass('_active')) ? 'drag' : 'click';
}

// 코드 생성 함수
function generateCode() {
	popOpen($('#pop-code')); // 코드뷰 팝업 출력
	
	var imgsrc = ($('#workspace-img').attr('src').slice(0, 4) == 'blob') ? '<em>filepath</em>' : $('#workspace-img').attr('src'); // 이미지 소스
	var gcAloop = ''; // A 태그 마크업 루프
	var gcMloop = ''; // 이미지맵 마크업 루프
	var gcAlert = '<em class="pop-content-alert">&#9888; You have to replace each red text with a value.</em>';

	for (i=0;i<cnt;i++) {
		// A 태그 형태 좌표 및 크기
		var top = (unit == 'px') ? $('#grid-box-' + i).position().top + 1 : ($('#grid-box-' + i).position().top / (imgHeight - 2) * 100).toFixed(2);
		var left = (unit == 'px') ? $('#grid-box-' + i).position().left + 1 : ($('#grid-box-' + i).position().left / (imgWidth - 2) * 100).toFixed(2);
		var width = (unit == 'px') ? $('#grid-box-' + i).width() : ($('#grid-box-' + i).width() / imgWidth * 100).toFixed(2);
		var height = (unit == 'px') ? $('#grid-box-' + i).height() : ($('#grid-box-' + i).height() / imgHeight * 100).toFixed(2);
		
		// 이미지맵 형태 좌표 (px만 가능)
		var startCoordX = parseInt($('#grid-box-' + i).position().left + 1);
		var startCoordY = parseInt($('#grid-box-' + i).position().top + 1);
		var endCoordX = parseInt(startCoordX + $('#grid-box-' + i).width() + 1); // +1은 실보정 값
		var endCoordY = parseInt(startCoordY + $('#grid-box-' + i).height() + 1);
		
		var link = (mapEl[i][2]) ? mapEl[i][2] : '<em>link</em>';
		var target = (mapEl[i][3]) ? mapEl[i][3] : '<em>target</em>';
		
		// 마크업 루프 생성
		gcAloop += '&nbsp;&nbsp;&nbsp;&nbsp;&lt;a href="' + link + '" style="position:absolute; top:' + top + unit + '; left:' + left + unit + '; width:' + width + unit + '; height:' + height + unit + '; display:block; background:url(about:blank);"&gt;' + '<br>';
		gcMloop += '&nbsp;&nbsp;&nbsp;&nbsp;&lt;area shape="rect" coords="' + startCoordX + ', ' + startCoordY + ', ' + endCoordX + ', ' + endCoordY + '" href="' + link + '" target="' + target + '"&gt;' + '<br>';
	}
	
	// A 태그 마크업
	var gcA = gcAlert + '&lt;div style="position:relative"&gt;' + '<br>' + '&nbsp;&nbsp;&nbsp;&nbsp;&lt;img src="' + imgsrc + '"&gt;' + '<br>' + gcAloop + '&lt;/div&gt;';
	$('#pop-codegen-a .pop-content p').html(gcA); // 생성된 마크업 출력
	
	// 이미지맵 마크업
	var gcM = gcAlert + '&lt;img src="' + imgsrc + '" usemap="#<em>mapname</em>"&gt;' + '<br>' + '&lt;map name="<em>mapname</em>"&gt;' + '<br>' + gcMloop + '&lt;/map&gt;';
	$('#pop-codegen-im .pop-content p').html(gcM); // 생성된 마크업 출력
}

// 팝업 열기
function popOpen($popup) {
	$('#dim').show().css({ opacity: 0.5 }); // 딤 스크린 표시
	
	$popup.show().css({ top: $(window).height() / 2 - $popup.height() / 2, left: $(window).width() / 2 - $popup.width() / 2 });	
	$popup.find('input').eq(0).focus(); // 첫 번째 인풋 자동 포커싱
}

// 팝업 닫기
function popClose() {
	$('#dim, .pop').hide();
	$('.pop-content').each(function() { $(this).find('input[type="text"], input[type="file"]').val(''); }); // 인풋 초기화
}

/***********************************************************************************************
 * 3) 이미지 불러오기
 ***********************************************************************************************/
$(document).on('click', '#pop-local .pop-btn-confirm, #pop-url .pop-btn-confirm', loadImgSrc); // 이미지 소스 로드 함수 호출
$(document).on('change', '#pop-local-input', parsePath); // 로컬 이미지 패스 파싱 함수 호출

// 이미지 소스 로드 함수
function loadImgSrc() {
	// 인풋 값 유무 확인
	if ($(this).parents('.pop').find('input').val()) {
		$('#workspace-img').remove(); // 이미지 삭제
		
		if ($(this).parents('.pop').attr('id') == 'pop-local')
			$img.prepend('<img src="' + filepath + '" id="workspace-img">');
		else
			$img.prepend('<img src="' + $('#pop-url-input').val() + '" id="workspace-img">');
	} else {
		alert('No input value');
		return false;
	}
	
	popClose();
	resetMapElView();
	$('#workspace-img').on('load', rulerInit); // 이미지 로드 이후 눈금자 재설정
}

// 로컬 이미지 패스 파싱 함수
function parsePath(e) {
	var URL = window.webkitURL || window.URL;
    filepath = URL.createObjectURL(e.target.files[0]);
}

/***********************************************************************************************
 * 4) 그리드
 ***********************************************************************************************/
// 그리드 좌표 배열 선언
var pointStart = new Array();
var pointEnd = new Array();
var mapEl = new Array(); // 각 객체 좌표 저장 3차원 배열

$(document).on('mousemove', '#workspace-img-wrap', drawGrid).on('mousedown mouseup', '#workspace-img-wrap', setGrid).on('mouseleave', '#workspace-img-wrap', resetGrid);
$(document).on('mouseenter mouseleave', '.grid-box', overMapElView).on('mouseup', '.grid-box', clickMapElView).on('click', '.grid-box-close', removeMapElView);
$(document).on('click', '.grid-box-link', addLinkToMapEl).on('click', '#pop-addlink .pop-btn-confirm', setLinkToMapEl);

$(document).on('mousedown', '#workspace-ruler', function() { return false; })

// 그리드 위치 제어 함수
function drawGrid(e) {
	if (phase == 1) $img.addClass('_phase1');
	else $img.removeClass('_phase1');
	
	// 단계별 제어 그리드 선택
	$activeGridX = (phase == 0) ? $('#grid-x1') : $('#grid-x2');
	$activeGridY = (phase == 0) ? $('#grid-y1') : $('#grid-y2');

	// 그리드 위치 제어
	$activeGridX.css({ top: e.pageY - $('#gnb').height() - $('#workspace-ruler-x').height() - 1 });
	$activeGridY.css({ left: e.pageX - $('#workspace-ruler-y').width() - 1 });
	
	// 좌표 출력계 위치 제어
	$('#grid-coords').css({
		top: (e.pageY < $('#gnb').height() + $('#workspace-ruler-x').height() + imgHeight - $('#grid-coords').outerHeight() - 5 ) ? e.pageY - $('#gnb').height() - $('#workspace-ruler-x').height() + 5 : e.pageY - $('#gnb').height() - $('#workspace-ruler-x').height() - $('#grid-coords').outerHeight() - 6,
		left: (e.pageX < $('#workspace-ruler-y').width() + imgWidth - $('#grid-coords').outerWidth() - 5) ? e.pageX - $('#workspace-ruler-y').width() + 5 : e.pageX - $('#workspace-ruler-y').width() - $('#grid-coords').outerWidth() - 6
	});
		
	// 포지션 저장
	posX = (unit == 'px') ? $activeGridY.position().left + 1 : (($activeGridY.position().left) / (imgWidth - 2) * 100).toFixed(2);
	posY = (unit == 'px') ? $activeGridX.position().top + 1 : (($activeGridX.position().top) / (imgHeight - 2) * 100).toFixed(2);

	$('#grid-coords').text(posX + unit + ', ' + posY + unit); // 포지션 출력
}

// 그리드 고정
function setGrid(e) {
	if (!$img.hasClass('_overmap')) {
		$('.grid-box').removeClass('_active');
		
		if (measure == 'drag') {
			if (e.type == 'mousedown') setGridPoint(pointStart);
			else if (phase == 0) return false;
			else setGridPoint(pointEnd);
		} else {
			if (e.type == 'mouseup') {
				if (phase == 0) setGridPoint(pointStart);
				else setGridPoint(pointEnd);
			} else return;
		}
		
		var limX = (unit == 'px') ? Math.abs(pointStart[0] - pointEnd[0]) : Math.abs(pixelize(pointStart[0], 'x') - pixelize(pointEnd[0], 'x'));
		var limY = (unit == 'px') ? Math.abs(pointStart[1] - pointEnd[1]) : Math.abs(pixelize(pointStart[1], 'y') - pixelize(pointEnd[1], 'y'));
		
		if (limX < 20 || limY < 20) return false; // 가로 또는 세로가 20px 미만일 때 맵 엘리먼트 생성 금지
		
		if (phase == 0) {
			cnt++;
			mapEl.push([pointStart.slice(0), pointEnd.slice(0)]); // 3차원 배열 저장 (Call by value)

			addMapElView(cnt - 1);
		}
		
		event.preventDefault();
	} else return;
}

function pixelize(val, axis) {
	var valOut = (axis == 'x') ? imgWidth * val / 100 : imgHeight * val / 100;
	return valOut;
}

// 그리드 포인트 좌표 저장
function setGridPoint(point) {
	point[0] = posX; // X축 좌표값 저장
	point[1] = posY; // Y축 좌표값 저장
	
	phase = (phase == 0) ? 1 : 0; // 단계 토글
}

// 현재 그리드 초기화
function resetGrid() {
	phase = 0;
	$img.removeClass('_phase1');
	$('#grid-x1').css({ top: posY - 1 });
	$('#grid-y1').css({ left: posX - 1 });
}

// 맵 엘리먼트 추가
function addMapElView(index) {
	$img.append('<div class="grid-box" id="grid-box-' + index + '"><span class="grid-box-cnt">' + (index + 1) + '</span><span class="grid-box-close">&times;</span><span class="grid-box-link">ADD LINK</span></div>');
	
	$('#grid-box-' + index).css({
		width: (unit == 'px') ? Math.abs(mapEl[index][1][0] - mapEl[index][0][0]) : Math.abs(mapEl[index][1][0] - mapEl[index][0][0]) / 100 * imgWidth,
		height: (unit == 'px') ? Math.abs(mapEl[index][1][1] - mapEl[index][0][1]) : Math.abs(mapEl[index][1][1] - mapEl[index][0][1]) / 100 * imgHeight,
		top: (unit == 'px') ? Math.min(mapEl[index][0][1], mapEl[index][1][1]) : Math.min(mapEl[index][0][1], mapEl[index][1][1]) / 100 * imgHeight,
		left: (unit == 'px') ? Math.min(mapEl[index][0][0], mapEl[index][1][0]) : Math.min(mapEl[index][0][0], mapEl[index][1][0]) / 100 * imgWidth
	});
	
	if ($('#grid-box-' + index).width() < 50 || $('#grid-box-' + index).height() < 50) $('#grid-box-' + index).addClass('_errorhash');
	
	if (mapEl[index][2]) {
		$('#grid-box-' + index).addClass('_added');
		$('#grid-box-' + index).find('.grid-box-link').text('CHANGE LINK');
	}
}

// 맵 엘리먼트 마우스오버
function overMapElView(e) {
	if (e.type == 'mouseenter' && phase == 0) $img.addClass('_overmap');
	else $img.removeClass('_overmap');
}

// 맵 엘리먼트 클릭
function clickMapElView() {
	if ($(this).hasClass('_moving')) {
		$('.grid-box').removeClass('_active');
		$(this).removeClass('_moving');
		$(this).addClass('_active');
		recalcElMap();
	}
}

// 맵 엘리먼트 삭제
function removeMapElView() {
	if ($('.grid-box._active').length > 0) {
		var delIndex = $('.grid-box._active').attr('id').split('-')[2]; // 아이디에서 인덱스 파싱

		if (confirm('Do you really want to delete this element?')) {
			$('.grid-box._active').remove();
			$img.removeClass('_overmap');
			cnt--;
			mapEl.splice(delIndex, 1); // 배열에서 해당 인덱스 노드 삭제
			$('.grid-box').remove();
			
			for (i=0;i<cnt;i++) {
				addMapElView(i); // 순서 재구성
			}
		}
	}
}

// 맵 엘리먼트 리셋
function resetMapElView() {
	$img.removeClass('_overmap');
	$('.grid-box').remove();
	cnt = 0;
	mapEl = [];
}

// 맵 엘리먼트 링크 추가
function addLinkToMapEl() {
	popOpen($('#pop-addlink'));
	
	if ($('.grid-box._active').hasClass('_added')) {
		var targetIndex = $('.grid-box._active').attr('id').split('-')[2];
		var urlink = mapEl[targetIndex][2];
		var target = mapEl[targetIndex][3];
		$('#pop-addlink .pop-title').text('CHANGE URL LINK');
		$('#pop-addlink .pop-btn-confirm').text('CHANGE LINK');
		$('#pop-addlink-input').val(urlink);
		$('input[name="pop-addlink-target"][value="'+ target +'"]').prop('checked', true);
	} else {
		$('#pop-addlink .pop-title').text('ADD URL LINK');
		$('#pop-addlink .pop-btn-confirm').text('ADD LINK');
		$('input[name="pop-addlink-target"]').eq(0).prop('checked', true);
	}
		
	return false;
}

// 맵 엘리먼트 링크 설정
function setLinkToMapEl() {
	var addIndex = $('.grid-box._active').attr('id').split('-')[2];
	
	if ($('#pop-addlink-input').val()) {		
		mapEl[addIndex][2] = $('#pop-addlink-input').val();
		mapEl[addIndex][3] = $('input[name="pop-addlink-target"]:checked').val();
	}
	else {
		alert('No input value');
		return false;
	}
	$('.grid-box._active').addClass('_added');
	$('.grid-box._active .grid-box-link').text('CHANGE LINK');
	popClose();
}

// 키 입력 이벤트
function keyEvents(e) {
	switch (e.keyCode) {
		case 27: // ESC 키
			if ($('#dim').css('display') == 'block') popClose(); // 팝업 닫기
			else if (phase == 1) resetGrid(); // 현재 그리드 초기화
			break;
		case 46: // DEL 키
			removeMapElView();
			break;
	}
}

/***********************************************************************************************
 * 5) 코드 출력
 ***********************************************************************************************/
$(document).on('click', '.pop-btn-copy', codeView).on('click', '.pop-btn-cancel._back', codeViewBack);

// 코드뷰 팝업 출력
function codeView() {
	popClose();
	if ($(this).attr('id') == 'pop-btn-copy-a') popOpen($('#pop-codegen-a'));
	else popOpen($('#pop-codegen-im'));
}

// 뒤로가기 버튼
function codeViewBack() {
	popOpen($('#pop-code'));
}

/***********************************************************************************************
 * 6) 맵 엘리먼트 제어 추가
 ***********************************************************************************************/
var beforePosX, beforePosY, beforeElPosX, beforeElPosY;

$(document).on('mousedown', '.grid-box', boxMoveStart).on('mousemove mouseleave', '.grid-box._moving', boxMove); // 맵 엘리먼트 이동

// 맵 엘리먼트 이동 시작
function boxMoveStart(e) {
	if ($(e.target)[0] != $(this).find('.grid-box-link')[0] && $(e.target)[0] != $(this).find('.grid-box-close')[0]) {
		$('.grid-box').removeClass('_active');
		$(this).addClass('_moving');
		beforeElPosX = $(this).position().left;
		beforeElPosY = $(this).position().top;
		beforeClickPosX = e.pageX - $('#workspace-ruler-y').outerWidth() - $(this).position().left;
		beforeClickPosY = e.pageY - $('#workspace-ruler-x').outerHeight() - $('#gnb').outerHeight() - $(this).position().top;
	}	
}

// 맵 엘리먼트 이동
function boxMove(e) {
	if (e.type == 'mousemove') {
		var mPosX = e.pageX - $('#workspace-ruler-y').outerWidth();
		var mPosY = e.pageY - $('#workspace-ruler-x').outerHeight() - $('#gnb').outerHeight();
		
		if (mPosX - beforeClickPosX < 0)
			$(this).css({ left: 0 });
		else if (mPosX + $(this).outerWidth() - beforeClickPosX + 1 > imgWidth)
			$(this).css({ left: imgWidth - $(this).outerWidth() - 1 });
		else
			$(this).css({ left: mPosX - beforeClickPosX });
		
		if (mPosY - beforeClickPosY < 0)
			$(this).css({ top: 0 });
		else if (mPosY + $(this).outerHeight() - beforeClickPosY + 1 > imgHeight)
			$(this).css({ top: imgHeight - $(this).outerHeight() - 1 });
		else
			$(this).css({ top: mPosY - beforeClickPosY });
	}
	else {
		$(this).removeClass('_moving');
		$(this).addClass('_active');
		recalcElMap();
	}
}

function recalcElMap() {
	var recalcIndex = $('.grid-box._active').attr('id').split('-')[2];
	
	mapEl[recalcIndex][0][0] = (unit == 'px') ? parseInt($('.grid-box._active').css('left')) : parseInt($('.grid-box._active').css('left')) / 10000 * imgWidth;
	mapEl[recalcIndex][0][1] = (unit == 'px') ? parseInt($('.grid-box._active').css('top')) : parseInt($('.grid-box._active').css('top')) / 10000 * imgWidth;
	mapEl[recalcIndex][1][0] = (unit == 'px') ? parseInt($('.grid-box._active').css('left')) + $('.grid-box._active').outerWidth() : (parseInt($('.grid-box._active').css('left')) + $('.grid-box._active').outerWidth()) / 10000 * imgWidth;
	mapEl[recalcIndex][1][1] = (unit == 'px') ? parseInt($('.grid-box._active').css('top')) + $('.grid-box._active').outerHeight() : (parseInt($('.grid-box._active').css('top')) + $('.grid-box._active').outerHeight()) / 10000* imgWidth;
	console.log(mapEl[recalcIndex][0][0])
}