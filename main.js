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
    
    // useless progress bar
    var progress = 0; // progress on the progress bar
    var progressBar = $('#progress-loading-files'); // the progress bar
    var finished = false;
    
    setTimeout(function() {
        if(!finished) {
            $('#timeout-loading-message').text('This might take a little longer the first time...');
        }
    }, 3000);
    
    setTimeout(function() {
        if(!finished) {
            $('#timeout-loading-message').html('Hmm.. should be done by now. Something is wrong! <a href="mailto:jwclark@rockhursths.edu?subject=Problem with QuickRoster&body=Please take a look at QuickRoster. I could not get past loading.">Email J.W.</a>');        
        }
    }, 8000)
    
    // hides the "JavaScript is required" warning
    $('#nojs').hide();
    
    // utility: log to prevent circular reference
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

        // data objects
        var courses = {};
        var students = {};
        var teachers = {};

        // a list of teachers by email
        var teacherEmails = [];

        // this is what the user downloads
        var csvDownloadData = []; // an array to store the current data view as comma separated values file

        // updates the CSV Download link to match the current data view 
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

        // lists students after a teacher's course is clicked
        window.listStudents = function(id) {
            var course = courses[id];
            var studentList = $('#students');
            studentList.html('');
            csvDownloadData = [];
            csvDownloadData.push('Last Name,First Name,Student ID,Email,Course');

            log('listing students from courses[' + id + '] = ', course.roster);

            var html = '<tr><th>Last Name</th><th>First Name</th><th>Student ID</th><th>Email</th></tr>';
            for(var i = 0; i < course.roster.length; i++) {
                var studentID = course.roster[i];
                var student = students[studentID];
                html += '<tr><td>' + student.lname + '</td><td>' + student.fname + '</td><td>' + student.id + '</td><td>' + student.email + '</td></tr>';
                csvDownloadData.push(student.lname + "," + student.fname + "," + student.id + "," + student.email + "," + course.id + " " + course.name);
            }
            studentList.append(html);
            updateCSVDownloadLink(course);
            $('#list-students').show();
            $('#list-courses').hide();
            $('#courseName').text(course.name);
        };

        // lists courses by teacher after search
        var listCourses = function(email) {
            log('listing courses for teacher with email = ', email);
            
            var teacher; // a variable to hold this found teacher
            
            // linear search for a teacher that matches the above email parameter
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
            
            // load this teacher's courses
            var tempCourseList = [];
            for(var i = 0; i < teacher.courses.length; i++) {
                var courseid = teacher.courses[i];
                if(courses.hasOwnProperty(courseid)) {
                    tempCourseList.push(courses[courseid]);
                }
            }
            
            // sort the courses
            var sortByTermThenName = function(a, b) {
                // https://stackoverflow.com/a/9175302/1161948
                
                // by term
                if(a.term > b.term) {
                    return 1;
                } else if(a.term < b.term) {
                    return -1;
                }
                
                // then by name
                if(a.name > b.name) {
                    return 1;
                } else if(a.name < b.name) {
                    return -1;
                } else {
                    return 0;
                }
            };
            
            tempCourseList.sort(sortByTermThenName);
            
            log('loop through courses = ', tempCourseList);
            
            // display the courses
            for(var i = 0; i < tempCourseList.length; i++) {
                if(courses.hasOwnProperty(courseid)) {
                    var course = tempCourseList[i];
                    var courseKey = courseMapKey(course.name, course.id, course.term);
                    log('course = ', course);
                    html += '<tr id="' + courseKey + '" onclick="listStudents(this.id);"><td>' + course.id + '</td><td>' + course.name + '</td><td>' + course.term + '</td></tr>';
                } else {
                    log('courses has no property = ', courseid);
                }
            }

            courseList.append(html);
        };

        // return the key that looks up a course from the courses object
        var courseMapKey = function(name, id, term) {
            return name.trim() + id.trim() + term.trim();
        };

        // parse roster.tsv into data objects
        var parseTSV = function(data) {
            
            data = data.split('\n');
            
            log('parsing roster.tsv with ' + data.length + ' records');
            
            // loop through the tsv file
            for(var i = 1; i < data.length; i++) { // from i = 1, ignores header row
                var tsv = data[i].split('\t');

                var teacher = {
                    fname: tsv[9],
                    lname: tsv[10],
                    email: tsv[11]
                }

                var course = {
                    name: tsv[5],
                    id:   tsv[6],
                    term: tsv[8]
                }

                var student = {
                    fname: tsv[0],
                    lname: tsv[1],
                    grade: tsv[2],
                    id:    tsv[3],
                    email: tsv[4]
                }

                var courseKey = courseMapKey(course.name, course.id, course.term);

                // if student doesn't exist yet, create it
                if(!students.hasOwnProperty(student.email)) {
                    students[student.email] = student;
                }

                // if course doesn't exist yet, create it
                if(!courses.hasOwnProperty(courseKey)) {
                    course.roster = [];
                    course.roster.push(student.email);
                    courses[courseKey] = course;
                } else {
                    // course already exists, add student to course
                    course = courses[courseKey];
                    if(course.roster.indexOf(student.email) === -1) {
                        // student isn't in the roster yet, add them
                        course.roster.push(student.email);
                    }
                }

                // if teacher hasn't joined the teachers collection, add them
                if(!teachers.hasOwnProperty(teacher.email)) {
                    // also initialize a courses array for them
                    teacher.courses = [];
                    teacher.courses.push(courseKey); // and add this course to that array
                    teachers[teacher.email] = teacher;
                } else {
                    // teacher is in the collection
                    teacher = teachers[teacher.email];
                    if(teacher.courses.indexOf(courseKey) === -1) {
                        // but they don't have this class yet, so add it to their list
                        teacher.courses.push(courseKey);
                    }
                }

                // if this teacher's course does not yet exist, that's a potential problem... it would seem the teacher has a course without students in it
                if(!courses.hasOwnProperty(courseKey)) {
                    log('course didnt exist when parsing teacher = ' + teacher.email + '  and course.id = ' + course.id + " named " + course.name);
                    course = courses[courseKey];
                    if(course) {
                        course.teacher = teacher.email;
                    }
                }

                // teacher isn't in the email list yet
                if(teacherEmails.indexOf(teacher.email) === -1) {
                    teacherEmails.push(teacher.email);                    
                }
                
                updateProgress(i, data.length);
            }
            finished = true;
            log('finished parsing');
        };

        // update the progress bar
        var updateProgress = function(i, len) {
            if(i === len - 1) {
                $('#progress-container').hide();
                $('#search-container').show();
            }
        };

        // reset the gui
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

        // click event - list courses by teacher email
        $('#btnBackToCourses').click(function() {
            $('#list-students').hide();
            $('#list-courses').show();
        });
    
        // http request - get teacher data from tsv file
        $.get('data/roster.tsv', function(data) {
            log('fetching roster data');
            parseTSV(data);
        });
    }
});
