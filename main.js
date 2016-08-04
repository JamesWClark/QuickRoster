/* QuickRoster for Rockhurst High School
 * Written by JW Clark, April 2016
 *
 * Exports saved in Education Edge
 * Download the exports as teachers.xlsx and students.xlsx
 * Save the .xlxs files to .tsv format and upload to the following directory
 *
 * https://www.rockhursths.edu/file/QuickRoster/data/teachers.tsv
 * https://www.rockhursths.edu/file/QuickRoster/data/students.tsv
 */

$(document).ready(function() {
    
    // hides the JavaScript required warning
    $('#nojs').hide();
    
    // log to prevent circular reference
    var log = function(msg, obj) {
        console.log('\n');
        if(obj) {
            try {
                console.log(msg + JSON.stringify(obj));
            } catch(err) {
                var simpleObject = {};
                for (var prop in obj ){
                    if (!obj.hasOwnProperty(prop)){
                        continue;
                    }
                    if (typeof(obj[prop]) == 'object'){
                        continue;
                    }
                    if (typeof(obj[prop]) == 'function'){
                        continue;
                    }
                    simpleObject[prop] = obj[prop];
                }
                console.log('c-' + msg + JSON.stringify(simpleObject)); // returns cleaned up JSON
            }        
        } else {
            console.log(msg);
        }
    };
    
    // detects Internet Explorer
    var detectIE = function() {
        //http://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery
        
        var ua = window.navigator.userAgent;

        var msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }

        var trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }

        var edge = ua.indexOf('Edge/');
        if (edge > 0) {
           // Edge (IE 12+) => return version number
           return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
        }

        // other browser
        return false;
    }
    
    // app doesn't run on Internet Explorer
    if(detectIE()) {
        $('#msfail').text('This app supports Chrome, Firefox, and Safari.');
        $('#msfail').show();
    } else {
        $('#main').show();
        var tdata, sdata; // teacher and student data

        var totalFiles = 2;
        var loadedFiles = 0;

        var progress = 0; // progress on the progress bar
        var progressBar = $('#progress-loading-files'); // the progress bar

        var courses = {};
        var students = {};
        var teachers = {};

        var csvDownloadData = [];

        var teacherEmails = [];

        var updateCSVDownloadLink = function(course) {
            // http://stackoverflow.com/questions/17103398/convert-javascript-variable-value-to-csv-file
            csvDownloadData = csvDownloadData.join('\n');
            var contentType = 'text/csv';
            var csvFile = new Blob([csvDownloadData], { type : contentType});
            var csvFileName =  course.id + ' ' + course.name + '.csv';
            var btnDownload = $('#download');
            btnDownload.attr('href', window.URL.createObjectURL(csvFile));
            btnDownload.attr('download', csvFileName);
            log('a file is ready for download: ', csvFileName);
        };

        window.listStudents = function(id) {
            var course = courses[id];
            var studentList = $('#students');
            studentList.html('');
            csvDownloadData = [];
            csvDownloadData.push('Last Name,First Name,Student ID,Email');

            log('listing students from courses[' + id + '] = ', course.roster);

            var html = '<tr><th>Last Name</th><th>First Name</th><th>Student ID</th><th>Email</th></tr>';
            for(var i = 0; i < course.roster.length; i++) {
                var studentID = course.roster[i];
                var student = students[studentID];
                html += '<tr><td>' + student.lname + '</td><td>' + student.fname + '</td><td>' + student.id + '</td><td>' + student.email + '</td></tr>';
                csvDownloadData.push(student.lname + "," + student.fname + "," + student.id + "," + student.email);
            }
            studentList.append(html);
            updateCSVDownloadLink(course);
            $('#list-students').show();
            $('#list-courses').hide();
            $('#courseName').text(course.name);
        };

        var listCourses = function(email) {
            log('listing courses...');
            var teacher;
            for(var prop in teachers) {
                if(teachers.hasOwnProperty(prop)) {
                    if(teachers[prop].email === email) {
                        teacher = teachers[prop];
                    }
                }
            }

            log('teacher = ', teacher);
            log('courses = ', teacher.courses);

            $('#list-courses').show();
            $('#teacherName').text(teacher.fname + ' ' + teacher.lname);
            $('#teacherEmail').text(teacher.email);

            var courseList = $('#courses');
            var html = '<tr><th>Course ID</th><th>Course Name</th><th>Term</th></tr>';
            courseList.html('');

            for(var i = 0; i < teacher.courses.length; i++) {
                var course = courses[teacher.courses[i]];
                html += '<tr id="' + courseMapKey(course.id, course.term) + '" onclick="listStudents(this.id);"><td>' + course.id + '</td><td>' + course.name + '</td><td>' + course.term + '</td></tr>';
            }

            courseList.append(html);
        };

        var courseMapKey = function(id, term) {
            return id.trim().replace(' - ', '_').trim() + 't' + term.trim();
        };

        var parseTeachersTSV = function(data) {
            log('parsing teachers.tsv');
            data = data.split('\n');
            for(var i = 1; i < data.length; i++) { // from i = 1 ignores header row
                if(data[i].length > 0) {
                    var tsv = data[i].split('\t');

                    var teacher = {
                        lname:    tsv[0],
                        fname:    tsv[1],
                        fullName: tsv[2],
                        email:    tsv[3],
                        id:       tsv[4]
                    };

                    var course = {
                        id:   tsv[5],
                        name: tsv[6],
                        term: tsv[7]
                    };

                    if(!teachers.hasOwnProperty(teacher.id.toString())) {
                        teacher.courses = [];
                        teacher.courses.push(courseMapKey(course.id, course.term));
                        teachers[teacher.id.toString()] = teacher;
                    } else {
                        teacher = teachers[teacher.id.toString()];
                        if(teacher.courses.indexOf(courseMapKey(course.id, course.term)) === -1) {
                            teacher.courses.push(courseMapKey(course.id, course.term));
                        }
                    }

                    if(!courses.hasOwnProperty(courseMapKey(course.id, course.term))) {
                        log("error? course didn't exist when parsing teacher with course.id = ", course.id);
                        course = courses[courseMapKey(course.id, course.term)];
                        log('course = ', course);
                        if(course)
                            course.teacher = teacher.id;
                    }

                    if(teacherEmails.indexOf(teacher.email) === -1) {
                        teacherEmails.push(teacher.email);                    
                    }
                }
            }
        };

        var parseStudentsTSV = function(data) {
            log('parsing students.tsv');
            data = data.split('\n');
            for(var i = 1; i < data.length; i++) { // from i = 1 ignores header row
                if(data[i].length > 0) {
                    var tsv = data[i].split('\t');

                    var student = {
                        lname: tsv[0],
                        fname: tsv[1],
                        email: tsv[2],
                        id:    tsv[3],
                        grade: tsv[4]
                    };

                    var course = {
                        id:    tsv[5],
                        term:  tsv[6],
                        name:  tsv[7],
                        teacher: -1
                    };

                    // if student doesn't exist yet, create it
                    if(!students.hasOwnProperty(student.id.toString())) {
                        students[student.id.toString()] = student;
                    }

                    // if course doesn't exist yet, create it
                    if(!courses.hasOwnProperty(courseMapKey(course.id, course.term))) {
                        course.roster = []
                        course.roster.push(student.id.toString());
                        courses[courseMapKey(course.id, course.term)] = course;
                    } else {
                        // course already exists, add student to course
                        course = courses[courseMapKey(course.id, course.term)];
                        if(course.roster.indexOf(student.id.toString()) === -1) {
                            course.roster.push(student.id.toString());
                        }
                    }
                }
            }
        };

        // when loading and parsing is complete
        var next = function() {
            log('next');
            log('students = ', students);
            log('courses = ', courses);
            log('teachers = ', teachers);
        };

        // update the progress bar
        var updateProgress = function() {
            progress += 100 / (totalFiles * 2); // loading + parsing = 2
            progressBar.attr('value', progress);
            if(progress === 100) {
                $('#progress-container').hide();
                $('#search-container').show();
            }
        };

        // track data file progress
        var handleParse = function() {
            loadedFiles++;
            updateProgress();

            if(loadedFiles === totalFiles) {

                parseStudentsTSV(sdata);
                updateProgress();

                parseTeachersTSV(tdata);
                updateProgress();

                next();
            }
        };

        var reset = function() {
            $('#searchMessage').text('');
            $('#searchMessage').hide();
            $('#teacherName').text('');
            $('#teacherEmail').text('');
            $('#courseName').text('');
            $('#courses').html('');
            $('#students').html('');
            $('#list-courses').hide();
            $('#list-students').hide();
            $('#view-container').hide();
        };

        // get teacher data from tsv file
        $.get('data/teachers.tsv', function(data) {
            log('fetching teacher data');
            tdata = data;
            handleParse();
        });

        // get student data from tsv file
        $.get('data/students.tsv', function(data) {
            log('fetching student data');
            sdata = data;
            handleParse();
        });

        // filter search results
        var filterByStartingSubstring = function(substring) {
            return function(element) {
                return element.indexOf(substring) === 0;
            };
        };

        // update search results by filter with text input
        $('#search').keyup(function() {
            var substring = $(this).val().toLowerCase();
            var filter = teacherEmails.filter(filterByStartingSubstring(substring));
            if(substring.length === 0) {
                reset();
            } else if(filter.length === 0) {
                reset();
                $('#searchMessage').show();
                $('#searchMessage').text('No results...');
            } else if(filter.length > 1) {
                $('#searchMessage').show();
            } else if(filter.length === 1) {
                reset();
                var email = filter[0];
                log('filtered an email = ', email);
                $('#view-container').show();
                listCourses(email);
            } else {
                $('#view-container').hide();
            }
        });

        $('#btnBackToCourses').click(function() {
            $('#list-students').hide();
            $('#list-courses').show();
        });
    }
});
